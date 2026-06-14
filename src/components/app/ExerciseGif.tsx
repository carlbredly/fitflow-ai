"use client";

import { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";

const GIF_DB: [string, string][] = [
  // === POITRINE / PUSH ===
  ["developpe couche", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["bench press", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["developpe incline", "https://static.exercisedb.dev/media/PG1kcIb.gif"],
  ["incline press", "https://static.exercisedb.dev/media/PG1kcIb.gif"],
  ["developpe haltere", "https://static.exercisedb.dev/media/3d7wHyd.gif"],
  ["dumbbell press", "https://static.exercisedb.dev/media/3d7wHyd.gif"],
  ["pompe", "https://static.exercisedb.dev/media/0br45wL.gif"],
  ["push-up", "https://static.exercisedb.dev/media/0br45wL.gif"],
  ["push up", "https://static.exercisedb.dev/media/0br45wL.gif"],
  ["dips", "https://static.exercisedb.dev/media/05Cf2v8.gif"],
  ["cross-over", "https://static.exercisedb.dev/media/0CXGHya.gif"],
  ["cable crossing", "https://static.exercisedb.dev/media/0CXGHya.gif"],
  ["pectoral", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["chest", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["poitrine", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],

  // === DOS / PULL ===
  ["traction", "https://static.exercisedb.dev/media/0V2YQjW.gif"],
  ["pull up", "https://static.exercisedb.dev/media/0V2YQjW.gif"],
  ["pull-up", "https://static.exercisedb.dev/media/0V2YQjW.gif"],
  ["tirage", "https://static.exercisedb.dev/media/0MlxeMn.gif"],
  ["pulldown", "https://static.exercisedb.dev/media/0MlxeMn.gif"],
  ["rowing", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],
  ["row", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],
  ["dos", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],
  ["back", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],
  ["lats", "https://static.exercisedb.dev/media/0MlxeMn.gif"],
  ["cardio row", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],

  // === JAMBES / LEGS ===
  ["squat", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["souleve de terre", "https://static.exercisedb.dev/media/2DxtqHL.gif"],
  ["deadlift", "https://static.exercisedb.dev/media/2DxtqHL.gif"],
  ["fente", "https://static.exercisedb.dev/media/13VW2VO.gif"],
  ["lunge", "https://static.exercisedb.dev/media/13VW2VO.gif"],
  ["pont fessier", "https://static.exercisedb.dev/media/0rHfvy9.gif"],
  ["glute bridge", "https://static.exercisedb.dev/media/0rHfvy9.gif"],
  ["leg press", "https://static.exercisedb.dev/media/10Z2DXU.gif"],
  ["hack squat", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["leg extension", "https://static.exercisedb.dev/media/0lQnxMZ.gif"],
  ["leg curl", "https://static.exercisedb.dev/media/17lJ1kr.gif"],
  ["jambes", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["leg", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["cuisse", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["quadriceps", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["quads", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["ischio", "https://static.exercisedb.dev/media/17lJ1kr.gif"],
  ["hamstring", "https://static.exercisedb.dev/media/17lJ1kr.gif"],
  ["adducteur", "https://static.exercisedb.dev/media/0xDpB4L.gif"],
  ["abducteur", "https://static.exercisedb.dev/media/0xDpB4L.gif"],
  ["hip", "https://static.exercisedb.dev/media/0rHfvy9.gif"],

  // === FESSIERS / GLUTES ===
  ["fessier", "https://static.exercisedb.dev/media/0rHfvy9.gif"],
  ["glute", "https://static.exercisedb.dev/media/0rHfvy9.gif"],

  // === EPAULES / SHOULDERS ===
  ["developpe militaire", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["overhead press", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["shoulder press", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["militaire", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["laterale", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["lateral raise", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["front raise", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["raise avant", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["elevation", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["epaule", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["shoulder", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["delt", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["arnold", "https://static.exercisedb.dev/media/0dCyly0.gif"],
  ["face pull", "https://static.exercisedb.dev/media/0dCyly0.gif"],

  // === BRAS / ARMS ===
  ["curl", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["bicep", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["biceps", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["tricep", "https://static.exercisedb.dev/media/05Cf2v8.gif"],
  ["triceps", "https://static.exercisedb.dev/media/05Cf2v8.gif"],
  ["extension", "https://static.exercisedb.dev/media/05Cf2v8.gif"],
  ["hammer curl", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["preacher", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["concentration", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["bras", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["arm", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["avant bras", "https://static.exercisedb.dev/media/0IgNjSM.gif"],
  ["forearm", "https://static.exercisedb.dev/media/0IgNjSM.gif"],

  // === ABDOMINAUX / CORE ===
  ["planche", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["plank", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["crunch", "https://static.exercisedb.dev/media/03lzqwk.gif"],
  ["abdomin", "https://static.exercisedb.dev/media/03lzqwk.gif"],
  ["ab", "https://static.exercisedb.dev/media/03lzqwk.gif"],
  ["reprise", "https://static.exercisedb.dev/media/03lzqwk.gif"],
  ["gainage", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["russian twist", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["leg raise", "https://static.exercisedb.dev/media/03lzqwk.gif"],
  ["mountain climber", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["core", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["oblique", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["wipers", "https://static.exercisedb.dev/media/11wrviz.gif"],
  ["sit-up", "https://static.exercisedb.dev/media/03lzqwk.gif"],
  ["sit up", "https://static.exercisedb.dev/media/03lzqwk.gif"],

  // === MOLLETS / CALVES ===
  ["mollet", "https://static.exercisedb.dev/media/0jp9Rlz.gif"],
  ["calf", "https://static.exercisedb.dev/media/0jp9Rlz.gif"],

  // === CARDIO / RESPIRATION ===
  ["velo", "https://static.exercisedb.dev/media/0JtKWum.gif"],
  ["marche", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["burpee", "https://static.exercisedb.dev/media/0JtKWum.gif"],
  ["jumping jack", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["jumping", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["cardio", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["rameur", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],
  ["corde", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["treadmill", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["course", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["rowing machine", "https://static.exercisedb.dev/media/BJ0Hz5L.gif"],

  // === ETIREMENTS / MOBILITE ===
  ["etirement", "https://static.exercisedb.dev/media/01qpYSe.gif"],
  ["stretch", "https://static.exercisedb.dev/media/0mB6wHO.gif"],
  ["mobility", "https://static.exercisedb.dev/media/01qpYSe.gif"],
  ["flexibilite", "https://static.exercisedb.dev/media/0mB6wHO.gif"],
  ["yoga", "https://static.exercisedb.dev/media/01qpYSe.gif"],
  ["warm up", "https://static.exercisedb.dev/media/0mB6wHO.gif"],
  ["echauffement", "https://static.exercisedb.dev/media/0mB6wHO.gif"],

  // === EQUIPEMENT SPECIFIQUE ===
  ["kettlebell", "https://static.exercisedb.dev/media/0JtKWum.gif"],
  ["haltere", "https://static.exercisedb.dev/media/3d7wHyd.gif"],
  ["barre", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["cable", "https://static.exercisedb.dev/media/0CXGHya.gif"],
  ["poulie", "https://static.exercisedb.dev/media/0MlxeMn.gif"],
  ["elastique", "https://static.exercisedb.dev/media/0I5fUyn.gif"],
  ["band", "https://static.exercisedb.dev/media/0I5fUyn.gif"],
  ["machine", "https://static.exercisedb.dev/media/10Z2DXU.gif"],
  ["smith", "https://static.exercisedb.dev/media/0S75mYG.gif"],
  ["banc", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["bench", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["corps", "https://static.exercisedb.dev/media/0br45wL.gif"],
  ["body weight", "https://static.exercisedb.dev/media/0br45wL.gif"],
  ["poids du corps", "https://static.exercisedb.dev/media/0br45wL.gif"],

  // === HAUT DU CORPS GENERIQUE ===
  ["haut du corps", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["upper", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["push", "https://static.exercisedb.dev/media/EIeI8Vf.gif"],
  ["pull", "https://static.exercisedb.dev/media/0V2YQjW.gif"],

  // === BAS DU CORPS GENERIQUE ===
  ["bas du corps", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["lower", "https://static.exercisedb.dev/media/1gFNTZV.gif"],

  // === FULL BODY ===
  ["full body", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["full-body", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["tout le corps", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["burpee", "https://static.exercisedb.dev/media/0JtKWum.gif"],
  ["clean", "https://static.exercisedb.dev/media/2DxtqHL.gif"],
  ["snatch", "https://static.exercisedb.dev/media/2DxtqHL.gif"],
  ["thruster", "https://static.exercisedb.dev/media/1gFNTZV.gif"],
  ["box jump", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
  ["box", "https://static.exercisedb.dev/media/0Yz8WdV.gif"],
];

const CACHE_KEY = "fitflow-gif-cache";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findGif(name: string): string | null {
  const n = normalize(name);
  for (const [keyword, url] of GIF_DB) {
    if (n.includes(keyword)) return url;
  }
  return null;
}

function readCache(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}"); } catch { return {}; }
}

function writeCache(cache: Record<string, string>) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}

async function fetchGifFromApi(name: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      `https://oss.exercisedb.dev/api/v1/exercises?name=${encodeURIComponent(name)}&limit=1`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data?.[0]?.gifUrl ?? null;
  } catch { return null; }
}

function resolveGif(name: string): string | null {
  const n = normalize(name);
  const cached = readCache()[n];
  if (cached) return cached;
  return findGif(name);
}

export function ExerciseGif({ name, size = 48 }: { name: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(() => resolveGif(name));

  useEffect(() => {
    const found = resolveGif(name);
    if (found) {
      setSrc(found);
      return;
    }
    const n = normalize(name);
    fetchGifFromApi(name).then((url) => {
      if (url) {
        const c = readCache();
        c[n] = url;
        writeCache(c);
        setSrc(url);
      }
    });
  }, [name]);

  if (!src) {
    return (
      <div className="grid shrink-0 place-items-center rounded-xl bg-surface-2" style={{ width: size, height: size }}>
        <Dumbbell className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setSrc(null)}
      className="shrink-0 rounded-xl object-cover"
      style={{ width: size, height: size }}
    />
  );
}
