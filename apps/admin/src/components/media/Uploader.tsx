"use client";

import clsx from "clsx";
import { useRef, useState, type DragEvent } from "react";
import type { MediaItem } from "@/types/api";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { mediaApi } from "@/lib/api/endpoints";
import { isApiError } from "@/lib/api/errors";
import { ACCEPT_ATTR, MAX_BYTES, kindOfFile } from "./mediaUtils";
import { formatBytes } from "@/lib/i18n/config";

interface Job { id: number; name: string; size: number; progress: number; error?: string; done?: boolean }

/** Drag & drop + multi-file upload with client-side type/size checks and per-file progress. */
export function Uploader({ onUploaded, compact = false, disabled }: { onUploaded: (items: MediaItem[]) => void; compact?: boolean; disabled?: boolean }) {
  const { d, f, locale } = useI18n();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const handle = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const accepted: { file: File; job: Job }[] = [];
    const rejected: Job[] = [];
    list.forEach((file, i) => {
      const job: Job = { id: Date.now() + i, name: file.name, size: file.size, progress: 0 };
      if (!kindOfFile(file)) rejected.push({ ...job, error: f(d.media.badType, { name: file.name }) });
      else if (file.size > MAX_BYTES) rejected.push({ ...job, error: f(d.media.tooBig, { name: file.name }) });
      else accepted.push({ file, job });
    });
    setJobs((j) => [...rejected, ...accepted.map((a) => a.job), ...j].slice(0, 12));
    rejected.forEach((r) => toast({ tone: "error", title: r.error! }));

    const done: MediaItem[] = [];
    for (const { file, job } of accepted) {
      try {
        const base = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const item = await mediaApi.upload(file, { ar: base, en: base }, (p) => setJobs((all) => all.map((x) => (x.id === job.id ? { ...x, progress: p } : x))));
        done.push(item);
        setJobs((all) => all.map((x) => (x.id === job.id ? { ...x, progress: 100, done: true } : x)));
      } catch (e) {
        const msg = isApiError(e) ? Object.values(e.fieldErrors)[0]?.[0] ?? e.message : d.errors.generic;
        setJobs((all) => all.map((x) => (x.id === job.id ? { ...x, error: msg } : x)));
      }
    }
    if (done.length) { toast({ tone: "success", title: f(d.media.uploaded, { count: done.length }) }); onUploaded(done); }
    setTimeout(() => setJobs((all) => all.filter((x) => !x.done)), 2500);
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); if (!disabled && e.dataTransfer.files.length) void handle(e.dataTransfer.files); };

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); if (!disabled) setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}
        className={clsx("flex flex-col items-center justify-center rounded-card border-2 border-dashed text-center transition-colors",
          compact ? "gap-1 px-4 py-4" : "gap-2 px-6 py-8", over ? "border-brand-700 bg-brand-100/60" : "border-line bg-raised", disabled && "opacity-50")}>
        <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700"><Icon name="upload" /></span>
        <p className="text-sm">
          {d.media.dropzone}{" "}
          <button type="button" disabled={disabled} onClick={() => input.current?.click()} className="font-semibold text-brand-700 underline-offset-2 hover:underline">{d.media.browse}</button>
        </p>
        <p className="text-xs text-muted">{d.media.accepted}</p>
        <input ref={input} type="file" multiple accept={ACCEPT_ATTR} className="sr-only" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { if (e.target.files) void handle(e.target.files); e.target.value = ""; }} />
      </div>
      {jobs.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {jobs.map((j) => (
            <li key={j.id} className="rounded-lg border border-line bg-surface px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name={j.error ? "xCircle" : j.done ? "checkCircle" : "upload"} className={clsx("size-4", j.error ? "text-danger" : j.done ? "text-success" : "text-muted")} />
                <span className="min-w-0 flex-1 truncate" dir="ltr">{j.name}</span>
                <span className="num text-xs text-muted">{formatBytes(j.size, locale)}</span>
              </div>
              {j.error ? <p className="mt-1 text-xs text-danger">{j.error}</p> : (
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={j.progress} aria-label={`${d.media.uploading} ${j.name}`}>
                  <div className="h-full rounded-full bg-brand-700 transition-[width] duration-150" style={{ width: `${j.progress}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
