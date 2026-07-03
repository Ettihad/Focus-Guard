// Simple Web Audio synthesizer for timer notifications and distraction alerts

class AudioController {
  private ctx: AudioContext | null = null;
  private alarmOscillators: OscillatorNode[] = [];
  private alarmGain: GainNode | null = null;
  private isAlarmActive = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playChime(isCompletion = true) {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCompletion) {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3); // G5

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      console.warn('Audio context blocked by browser autoplay policy:', e);
    }
  }

  public startAlarm() {
    if (this.isAlarmActive) return;
    try {
      const ctx = this.getContext();
      this.isAlarmActive = true;

      this.alarmGain = ctx.createGain();
      this.alarmGain.gain.setValueAtTime(0.3, ctx.currentTime);

      // Create a two-tone pulsed beep
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1760, ctx.currentTime);

      // Pulsing effect
      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.setValueAtTime(6, ctx.currentTime);

      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(this.alarmGain.gain);

      osc1.connect(this.alarmGain);
      osc2.connect(this.alarmGain);
      this.alarmGain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      lfo.start();

      this.alarmOscillators = [osc1, osc2, lfo];
    } catch (e) {
      console.warn('Error starting alarm audio:', e);
      this.isAlarmActive = false;
    }
  }

  public stopAlarm() {
    if (!this.isAlarmActive) return;
    try {
      this.alarmOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.alarmOscillators = [];
      if (this.alarmGain) {
        this.alarmGain.disconnect();
        this.alarmGain = null;
      }
    } catch (e) {
      console.warn('Error stopping alarm audio:', e);
    } finally {
      this.isAlarmActive = false;
    }
  }

  public isAlarmPlaying(): boolean {
    return this.isAlarmActive;
  }
}

export const audio = new AudioController();
