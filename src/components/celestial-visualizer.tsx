"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pause, Play, RotateCw, CalendarDays, Zap, Orbit } from 'lucide-react';
import { cn } from '@/lib/utils';

// Constants for simulation
const ORBIT_RX = 250;
const ORBIT_RY = 180;
const SUN_RADIUS = 30;
const EARTH_RADIUS = 12;
const AXIAL_TILT = 23.5; // Degrees
const DAYS_IN_YEAR = 365.25;

const speedLevels = [1, 7, 30.4, 365.25]; // days per second for each level
const speedLabels = ['1 Day/s', '1 Week/s', '1 Month/s', '1 Year/s'];

const START_DATE = new Date('2024-03-20T00:00:00Z'); // Vernal Equinox

export default function CelestialVisualizer() {
  const [speedLevel, setSpeedLevel] = useState(1);
  const [isRotationEnabled, setRotationEnabled] = useState(true);
  const [isPaused, setPaused] = useState(false);
  const [simulationTime, setSimulationTime] = useState(0); // in days
  
  const animationFrameId = useRef<number>();
  const lastTimeRef = useRef<number>();

  const speed = useMemo(() => speedLevels[speedLevel], [speedLevel]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current === undefined) {
      lastTimeRef.current = time;
    }
    const deltaTime = (time - lastTimeRef.current) / 1000; // in seconds
    
    if (!isPaused) {
      setSimulationTime(prevTime => prevTime + deltaTime * speed);
    }
    
    lastTimeRef.current = time;
    animationFrameId.current = requestAnimationFrame(animate);
  }, [isPaused, speed]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      lastTimeRef.current = undefined;
    };
  }, [animate]);
  
  const dayOfYear = useMemo(() => simulationTime % DAYS_IN_YEAR, [simulationTime]);
  
  const getOrbitalStatus = useCallback((currentDay: number): string => {
    const day = Math.floor(currentDay);
    if (day >= 0 && day < 5 || day >= 360) return "Vernal Equinox";
    if (day > 5 && day < 86) return "Spring";
    if (day >= 86 && day < 96) return "Summer Solstice";
    if (day > 96 && day < 177) return "Summer";
    if (day >= 177 && day < 187) return "Autumnal Equinox";
    if (day > 187 && day < 268) return "Autumn";
    if (day >= 268 && day < 278) return "Winter Solstice";
    if (day > 278 && day < 360) return "Winter";
    return "In Orbit";
  }, []);

  const currentDate = useMemo(() => {
    const date = new Date(START_DATE);
    date.setDate(date.getDate() + Math.floor(simulationTime));
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [simulationTime]);

  const earthOrbitalAngle = (dayOfYear / DAYS_IN_YEAR) * 2 * Math.PI;
  const earthX = ORBIT_RX * Math.cos(earthOrbitalAngle);
  const earthY = ORBIT_RY * Math.sin(earthOrbitalAngle);

  const earthRotationAngle = isRotationEnabled ? (simulationTime * 360) % 360 : 0;
  
  const nightPathAngle = Math.atan2(earthY, earthX) * (180 / Math.PI);

  const nightPath = `M ${-EARTH_RADIUS},0 A ${EARTH_RADIUS},${EARTH_RADIUS} 0 0 1 ${EARTH_RADIUS},0 Z`;

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-2xl shadow-primary/10 overflow-hidden border-2 border-primary/20">
      <CardHeader className="text-center bg-card-foreground/5">
        <CardTitle className="text-3xl font-bold text-accent font-headline tracking-wider">Celestial Mechanics Visualizer</CardTitle>
        <CardDescription className="text-foreground/80">
          An interactive 2D simulation of Earth's revolution and rotation.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 aspect-square bg-background rounded-lg flex items-center justify-center p-4 border border-primary/10" data-ai-hint="space galaxy">
          <svg width="100%" height="100%" viewBox="-300 -220 600 440" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            
            {/* Orbit Path */}
            <ellipse cx="0" cy="0" rx={ORBIT_RX} ry={ORBIT_RY} fill="none" stroke="hsl(var(--accent))" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

            {/* Sun */}
            <g>
              <circle cx="0" cy="0" r={SUN_RADIUS} fill="url(#sun-gradient)" filter="url(#sun-glow)" />
              <radialGradient id="sun-gradient">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="60%" stopColor="#FDE68A" />
                <stop offset="100%" stopColor="#F97316" />
              </radialGradient>
            </g>

            {/* Earth */}
            <g transform={`translate(${earthX}, ${earthY})`}>
              <g transform={`rotate(${AXIAL_TILT})`}>
                <g transform={`rotate(${earthRotationAngle})`}>
                  <circle r={EARTH_RADIUS} fill="#3B82F6" />
                  <line x1="0" y1={-EARTH_RADIUS-5} x2="0" y2={EARTH_RADIUS+5} stroke="white" strokeWidth="1.5" opacity="0.7" />
                </g>
                <g transform={`rotate(${-AXIAL_TILT})`}>
                   <g transform={`rotate(${nightPathAngle})`}>
                     <path d={nightPath} fill="black" opacity="0.45" />
                   </g>
                </g>
              </g>
            </g>
          </svg>
        </div>

        <div className="lg:col-span-2 flex flex-col justify-center gap-6 p-4 rounded-lg bg-card-foreground/5">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 rounded-lg bg-primary/10">
              <Label className="text-sm text-accent font-semibold flex items-center justify-center gap-2"><CalendarDays size={16}/>SIMULATED DATE</Label>
              <p className="text-lg font-bold text-foreground/90 mt-1">{currentDate}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <Label className="text-sm text-accent font-semibold flex items-center justify-center gap-2"><Orbit size={16}/>ORBITAL POSITION</Label>
              <p className="text-lg font-bold text-foreground/90 mt-1">{getOrbitalStatus(dayOfYear)}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="speed-slider" className="flex items-center gap-2 text-foreground/80"><Zap size={16}/>Simulation Speed</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="speed-slider"
                  min={0}
                  max={speedLevels.length - 1}
                  step={1}
                  value={[speedLevel]}
                  onValueChange={(value) => setSpeedLevel(value[0])}
                  className="flex-1"
                  aria-label="Simulation speed"
                />
                <span className="text-sm font-medium text-accent w-24 text-center">{speedLabels[speedLevel]}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <Label htmlFor="rotation-switch" className="flex items-center gap-2 text-foreground/80">
                <RotateCw size={16}/> Earth's Rotation
              </Label>
              <Switch
                id="rotation-switch"
                checked={isRotationEnabled}
                onCheckedChange={setRotationEnabled}
                aria-label="Toggle Earth's rotation"
              />
            </div>
          </div>
          
          <Button onClick={() => setPaused(!isPaused)} variant="secondary" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isPaused ? <Play className="mr-2 h-5 w-5"/> : <Pause className="mr-2 h-5 w-5"/>}
            {isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          </Button>

        </div>
      </CardContent>
    </Card>
  );
}
