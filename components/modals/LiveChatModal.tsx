
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, Mic, MicOff, AlertTriangle, Save } from 'lucide-react';
import { connectLive, decode, decodeAudioData, createPcmBlob } from '../../services/geminiService';
import { LiveSession, LiveServerMessage } from '@google/genai';
import toast from 'react-hot-toast';

type Status = 'IDLE' | 'CONNECTING' | 'LISTENING' | 'SPEAKING' | 'ERROR';
interface TranscriptEntry {
    role: 'user' | 'assistant';
    text: string;
}

const LiveChatModal: React.FC = () => {
    const { settings, setActiveModal, addMessage, currentChatId, startNewChat } = useAppContext();
    const [status, setStatus] = useState<Status>('IDLE');
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [error, setError] = useState('');
    const [fullTranscript, setFullTranscript] = useState<TranscriptEntry[]>([]);

    const sessionRef = useRef<LiveSession | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioQueueRef = useRef<AudioBuffer[]>([]);
    const isPlayingRef = useRef(false);
    
    // Refs to store complete turn transcripts
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');


    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    const handleMessage = (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
            const text = message.serverContent.outputTranscription.text;
            setModelTranscript(prev => prev + text);
            currentOutputTranscriptionRef.current += text;
        }
        if (message.serverContent?.inputTranscription) {
            const text = message.serverContent.inputTranscription.text;
            setUserTranscript(prev => prev + text);
            currentInputTranscriptionRef.current += text;
        }
        if (message.serverContent?.turnComplete) {
            setFullTranscript(prev => [
                ...prev,
                { role: 'user', text: currentInputTranscriptionRef.current },
                { role: 'assistant', text: currentOutputTranscriptionRef.current }
            ]);
            currentInputTranscriptionRef.current = '';
            currentOutputTranscriptionRef.current = '';
            setUserTranscript('');
            setModelTranscript('');
        }
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio && outputAudioContextRef.current) {
            const audioBytes = decode(base64Audio);
            decodeAudioData(audioBytes, outputAudioContextRef.current, 24000, 1).then(buffer => {
                audioQueueRef.current.push(buffer);
                playAudioQueue();
            });
        }
    };
    
    const playAudioQueue = () => {
        if (isPlayingRef.current || audioQueueRef.current.length === 0 || !outputAudioContextRef.current) return;

        isPlayingRef.current = true;
        const buffer = audioQueueRef.current.shift();
        if (!buffer) {
            isPlayingRef.current = false;
            return;
        }

        const source = outputAudioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(outputAudioContextRef.current.destination);

        const now = outputAudioContextRef.current.currentTime;
        const startTime = Math.max(now, nextStartTimeRef.current);
        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            isPlayingRef.current = false;
            playAudioQueue();
        };
    };

    const startSession = async () => {
        if (status !== 'IDLE' && status !== 'ERROR') return;
        setStatus('CONNECTING');
        setError('');
        setFullTranscript([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            const sessionPromise = connectLive(settings, handleMessage, (e) => {
                setError('Connection error.');
                setStatus('ERROR');
            });
            
            const session = await sessionPromise;
            sessionRef.current = session;

            mediaStreamSourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                const pcmBlob = createPcmBlob(inputData);
                 sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);
            
            setStatus('LISTENING');

        } catch (err) {
            console.error(err);
            setError('Failed to start session. Check microphone permissions.');
            setStatus('ERROR');
            toast.error('Failed to access microphone.');
        }
    };

    const stopSession = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
             mediaStreamSourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }

        setStatus('IDLE');
    };

    const handleSaveTranscript = () => {
        let chatId = currentChatId;
        if (!chatId) {
            chatId = startNewChat();
        }
        
        fullTranscript.forEach(entry => {
            if (entry.text.trim()) {
                addMessage(chatId!, {
                    id: `msg-${Date.now()}-${Math.random()}`,
                    role: entry.role,
                    type: 'text',
                    content: entry.text,
                    timestamp: Date.now()
                });
            }
        });
        toast.success("مکالمه در گفتگوی فعلی ذخیره شد.");
        handleClose();
    };


    const handleClose = () => {
        stopSession();
        setActiveModal(null);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-auto flex flex-col h-[80vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-2xl font-bold">مکالمه زنده</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><X size={20} /></button>
                </div>
                
                <div className="flex-grow flex flex-col bg-[var(--bg-primary)] p-4 rounded-lg overflow-y-auto">
                    <div className="flex-1 space-y-4">
                        <div className="text-right">
                            <span className="font-bold text-sm">شما:</span>
                            <p className="min-h-[50px] p-2 bg-[var(--bg-secondary)] rounded-md">{userTranscript}</p>
                        </div>
                        <div>
                            <span className="font-bold text-sm">Gemini:</span>
                            <p className="min-h-[50px] p-2 bg-[var(--bg-secondary)] rounded-md">{modelTranscript}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center flex-shrink-0">
                    <div className="flex items-center gap-4">
                        {status === 'IDLE' && fullTranscript.length > 0 && (
                             <button onClick={handleSaveTranscript} className="px-6 py-3 rounded-full flex items-center justify-center gap-2 bg-green-500 text-white font-bold transition-colors hover:bg-green-600" title="ذخیره مکالمه">
                                <Save size={24} />
                            </button>
                        )}
                        <button 
                            onClick={status === 'LISTENING' ? stopSession : startSession}
                            className={`px-6 py-3 rounded-full flex items-center justify-center gap-2 text-white font-bold transition-colors
                                ${status === 'LISTENING' ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--accent-color)] hover:bg-[var(--accent-color-dark)]'}`}
                        >
                            {status === 'IDLE' ? <><Mic size={24} /> Start</> : status === 'CONNECTING' ? <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-white"></div> : status === 'LISTENING' ? <><MicOff size={24} /> Stop</> : <><AlertTriangle size={24} /> Retry</>}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            </div>
        </div>
    );
};

export default LiveChatModal;
