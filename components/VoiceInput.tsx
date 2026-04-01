'use client'

import { useEffect, useRef, useState } from 'react'

type VoiceState = 'idle' | 'recording' | 'processing' | 'error'

interface Props {
  language?: string           // 'es' for Spanish, 'en' for English
  onTranscript: (text: string) => void
  disabled?: boolean
  autoStart?: boolean         // start recording immediately on mount
}

const SILENCE_THRESHOLD = 0.01   // RMS below this = silence
const SILENCE_DURATION = 1200    // ms of silence before auto-stop
const MAX_DURATION = 8000        // ms max recording

export default function VoiceInput({ language = 'es', onTranscript, disabled, autoStart }: Props) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  function clearTimers() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }

  function stopRecording() {
    clearTimers()
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }

  async function startRecording() {
    setErrorMsg(null)
    setVoiceState('recording')
    chunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analyser for silence detection
      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        clearTimers()
        ctx.close()
        if (chunksRef.current.length === 0) {
          setVoiceState('idle')
          return
        }
        setVoiceState('processing')
        const blob = new Blob(chunksRef.current, { type: mimeType })
        await transcribe(blob, mimeType)
      }

      recorder.start(100) // collect in 100ms chunks

      // Silence detection loop
      const dataArr = new Uint8Array(analyser.fftSize)
      let silenceStart: number | null = null

      function checkSilence() {
        if (mediaRecorderRef.current?.state !== 'recording') return
        analyser.getByteTimeDomainData(dataArr)
        // Calculate RMS
        let sum = 0
        for (let i = 0; i < dataArr.length; i++) {
          const v = (dataArr[i] - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / dataArr.length)

        if (rms < SILENCE_THRESHOLD) {
          if (silenceStart === null) silenceStart = Date.now()
          else if (Date.now() - silenceStart >= SILENCE_DURATION) {
            stopRecording()
            return
          }
        } else {
          silenceStart = null
        }
        animFrameRef.current = requestAnimationFrame(checkSilence)
      }
      animFrameRef.current = requestAnimationFrame(checkSilence)

      // Max duration safety
      maxTimerRef.current = setTimeout(stopRecording, MAX_DURATION)

    } catch (e) {
      console.error('Mic error:', e)
      setErrorMsg('Microphone access denied')
      setVoiceState('error')
    }
  }

  async function transcribe(blob: Blob, mimeType: string) {
    try {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `audio.${ext}`, { type: mimeType })
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('language', language)

      const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData })
      const data = await res.json()

      if (data.text) {
        onTranscript(data.text)
      } else {
        setErrorMsg('Could not transcribe audio')
      }
    } catch (e) {
      setErrorMsg('Transcription failed')
    } finally {
      setVoiceState('idle')
    }
  }

  function handleClick() {
    if (disabled) return
    if (voiceState === 'recording') {
      stopRecording()
    } else if (voiceState === 'idle' || voiceState === 'error') {
      startRecording()
    }
  }

  useEffect(() => {
    if (autoStart && !disabled) {
      startRecording()
    }
    return () => { stopRecording() }
  }, [])

  const isRecording = voiceState === 'recording'
  const isProcessing = voiceState === 'processing'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        title={isRecording ? 'Click to stop' : 'Click to speak'}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: `2px solid ${isRecording ? '#ef4444' : isProcessing ? 'var(--text-muted)' : 'var(--border)'}`,
          background: isRecording ? 'rgba(239,68,68,0.12)' : 'transparent',
          cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          transition: 'all 0.15s ease',
          opacity: disabled ? 0.4 : 1,
          animation: isRecording ? 'pulse 1s ease-in-out infinite' : 'none',
        }}
      >
        {isProcessing ? '⏳' : isRecording ? '⏹' : '🎙'}
      </button>
      {isRecording && (
        <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Listening…</span>
      )}
      {isProcessing && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Processing…</span>
      )}
      {errorMsg && (
        <span style={{ fontSize: 10, color: '#ef4444' }}>{errorMsg}</span>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  )
}
