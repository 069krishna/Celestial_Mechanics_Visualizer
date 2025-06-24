"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Pause, Play, RotateCw, CalendarDays, Zap, Orbit, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

  const orbitalEccentricity = useMemo(() => Math.sqrt(1 - Math.pow(ORBIT_RY / ORBIT_RX, 2)), []);

  const distanceFromSun = useMemo(() => {
    const distanceInPixels = (ORBIT_RX * ORBIT_RY) / Math.sqrt(
        Math.pow(ORBIT_RY * Math.cos(earthOrbitalAngle), 2) +
        Math.pow(ORBIT_RX * Math.sin(earthOrbitalAngle), 2)
    );
    // Normalize to AU, where semi-major axis (ORBIT_RX) is ~1 AU
    return distanceInPixels / ORBIT_RX;
  }, [earthOrbitalAngle]);


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
      <CardFooter className="flex-col items-start gap-4 p-4 sm:p-6 border-t-2 border-primary/10 bg-card-foreground/5">
        <h3 className="text-xl font-bold text-accent font-headline tracking-wide flex items-center gap-2">
          <Info size={22} />
          Astronomical & Mathematical Details
        </h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="hover:no-underline">Key Parameters & Constants</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm p-2">
                  <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Axial Tilt</p>
                      <p className="font-mono text-base">{AXIAL_TILT.toFixed(1)}°</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Orbital Period</p>
                      <p className="font-mono text-base">{DAYS_IN_YEAR} days</p>
                  </div>
                   <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Orbital Eccentricity (e)</p>
                      <p className="font-mono text-base">{orbitalEccentricity.toFixed(4)}</p>
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="hover:no-underline">Live Simulation Data</AccordionTrigger>
             <AccordionContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm p-2">
                  <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Day of Year</p>
                      <p className="font-mono text-base">{dayOfYear.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Orbital Angle</p>
                      <p className="font-mono text-base">{(earthOrbitalAngle * 180 / Math.PI).toFixed(2)}°</p>
                  </div>
                   <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Distance from Sun</p>
                      <p className="font-mono text-base">{distanceFromSun.toFixed(4)} AU</p>
                  </div>
                   <div className="p-3 rounded-lg bg-background/50">
                      <p className="font-semibold text-accent/80">Earth's Rotation</p>
                      <p className="font-mono text-base">{earthRotationAngle.toFixed(2)}°</p>
                  </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger className="hover:no-underline">Kepler's Laws of Planetary Motion</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 text-sm text-foreground/80 p-2">
                <div>
                  <h4 className="font-semibold text-foreground">1. The Law of Ellipses</h4>
                  <p className="mt-1">The orbit of a planet is an ellipse with the Sun at one of the two foci. This simulation models Earth's orbit as a static ellipse.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">2. The Law of Equal Areas</h4>
                  <p className="mt-1">A line segment joining a planet and the Sun sweeps out equal areas during equal intervals of time. For simplicity, this simulation uses a constant angular speed. In reality, Earth moves fastest when closest to the Sun (perihelion) and slowest when farthest away (aphelion).</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">3. The Law of Harmonies</h4>
                  <p className="mt-1">The square of the orbital period (T) of a planet is directly proportional to the cube of the semi-major axis (a) of its orbit (T² ∝ a³). This law relates the orbital periods and distances of planets in the solar system.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardFooter>
    </Card>
  );
}
