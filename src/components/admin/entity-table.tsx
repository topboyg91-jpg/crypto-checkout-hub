import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FieldType = "text" | "number" | "textarea" | "boolean" | "select" | "image";

export type ColumnDef = {
  key: string;
  label: string;
  type?: FieldType;
  options?: { value: string; label: string }[];
  width?: string;
};

type Row = Record<string, unknown>;

/* eslint-disable @typescript-eslint/no-explicit-any */
// Generic admin grid: the table name is dynamic, so the generated row types
// cannot be applied here. Access goes through a loosely typed handle.
const db = supabase as unknown as {
  from: (table: string) => any;
};

export function useTableMutations(table: string, queryKeys: string[][]) {
  const qc = useQueryClient();
  const invalidate = () => queryKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));

  const update = useMutation({
    mutationFn: async ({ id, idKey, patch }: { id: string; idKey: string; patch: Row }) => {
      const { error } = await db.from(table).update(patch).eq(idKey, id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const insert = useMutation({
    mutationFn: async (row: Row) => {
      const { error } = await db.from(table).insert(row);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async ({ id, idKey }: { id: string; idKey: string }) => {
      const { error } = await db.from(table).delete().eq(idKey, id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { update, insert, remove };
}

/** Inline-editable grid backed directly by a database table. */
export function EntityTable({
  title,
  description,
  table,
  idKey = "id",
  rows,
  columns,
  queryKeys,
  newRowDefaults,
  allowCreate = true,
  allowDelete = true,
}: {
  title: string;
  description?: string;
  table: string;
  idKey?: string;
  rows: Row[];
  columns: ColumnDef[];
  queryKeys: string[][];
  newRowDefaults?: Row;
  allowCreate?: boolean;
  allowDelete?: boolean;
}) {
  const { update, insert, remove } = useTableMutations(table, queryKeys);
  const [draft, setDraft] = useState<Row>(newRowDefaults ?? {});
  const [error, setError] = useState<string | null>(null);

  const save = (row: Row, key: string, value: unknown) => {
    setError(null);
    update.mutate(
      { id: String(row[idKey]), idKey, patch: { [key]: value } },
      { onError: (e) => setError(e instanceof Error ? e.message : "Update failed") },
    );
  };

  return (
    <section className="bg-card border border-border rounded p-4">
      <header className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="font-semibold text-primary">{title}</h3>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <span className="text-xs text-muted-foreground">{rows.length} rows</span>
      </header>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className="pb-2 pr-3 font-semibold" style={{ width: c.width }}>
                  {c.label}
                </th>
              ))}
              {allowDelete && <th className="pb-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row[idKey])} className="border-t border-border align-top">
                {columns.map((c) => (
                  <td key={c.key} className="py-1.5 pr-3">
                    <CellInput column={c} value={row[c.key]} onCommit={(v) => save(row, c.key, v)} />
                  </td>
                ))}
                {allowDelete && (
                  <td className="py-1.5">
                    <button
                      aria-label="Delete row"
                      onClick={() => remove.mutate({ id: String(row[idKey]), idKey })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allowCreate && (
        <form
          className="mt-4 border-t border-border pt-3 flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            insert.mutate(draft, {
              onSuccess: () => setDraft(newRowDefaults ?? {}),
              onError: (err) => setError(err instanceof Error ? err.message : "Insert failed"),
            });
          }}
        >
          {columns.map((c) => (
            <label key={c.key} className="text-[11px] text-muted-foreground">
              <span className="block mb-0.5">{c.label}</span>
              <CellInput column={c} value={draft[c.key]} onCommit={(v) => setDraft((d) => ({ ...d, [c.key]: v }))} live />
            </label>
          ))}
          <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-semibold">Add</button>
        </form>
      )}
    </section>
  );
}

function CellInput({
  column,
  value,
  onCommit,
  live,
}: {
  column: ColumnDef;
  value: unknown;
  onCommit: (value: unknown) => void;
  live?: boolean;
}) {
  const [local, setLocal] = useState(value === null || value === undefined ? "" : String(value));
  const [touched, setTouched] = useState(false);
  const current = touched ? local : value === null || value === undefined ? "" : String(value);

  const commit = (raw: string) => {
    onCommit(column.type === "number" ? Number(raw) || 0 : raw);
    setTouched(false);
  };

  if (column.type === "boolean") {
    return (
      <input
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onCommit(e.target.checked)}
        aria-label={column.label}
      />
    );
  }

  if (column.type === "select") {
    return (
      <select
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => onCommit(e.target.value || null)}
        aria-label={column.label}
        className="w-full min-w-32 px-2 py-1 border border-border rounded bg-background"
      >
        <option value="">—</option>
        {(column.options ?? []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  const common = {
    value: current,
    "aria-label": column.label,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setTouched(true);
      setLocal(e.target.value);
      if (live) onCommit(column.type === "number" ? Number(e.target.value) || 0 : e.target.value);
    },
    onBlur: () => {
      if (!live && touched) commit(local);
    },
    className: "w-full min-w-28 px-2 py-1 border border-border rounded bg-background",
  };

  if (column.type === "image") return <ImageCell value={current} common={common} onCommit={commit} />;
  if (column.type === "textarea") return <textarea rows={3} {...common} />;
  return <input type={column.type === "number" ? "number" : "text"} step="any" {...common} />;
}

/** Image field: upload a file to storage, or paste a link. Shows a live preview. */
function ImageCell({
  value,
  common,
  onCommit,
}: {
  value: string;
  common: Record<string, unknown>;
  onCommit: (raw: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const preview = resolveImageUrl(value);

  const upload = async (file: File) => {
    setBusy(true);
    setUploadError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (error) throw error;
      onCommit(`/api/public/product-image/${path}`);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-1 min-w-56">
      <div className="flex items-center gap-2">
        {preview ? (
          <img src={preview} alt="" className="h-10 w-10 rounded object-cover border border-border" />
        ) : (
          <span className="h-10 w-10 rounded border border-dashed border-border" />
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <input type="text" step="any" placeholder="Paste image link" {...(common as any)} />
      </div>
      <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="px-2 py-1 border border-border rounded cursor-pointer hover:border-primary">
          {busy ? "Uploading…" : "Upload image"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void upload(file);
          }}
        />
      </label>
      {uploadError && <p className="text-[11px] text-destructive">{uploadError}</p>}
    </div>
  );
}
