// src/components/chat/ChatBubble.tsx
export type Attachment = {
  type: "image" | "audio";
  url?: string;      // آدرس نهایی (بعداً بک‌اند)
  blobUrl?: string;  // پیش‌نمایش کلاینتی
  name?: string;
  size?: number;
};

export default function ChatBubble({
  text,
  me,
  time,
  attachments,
}: {
  text?: string;
  me?: boolean;
  time?: string;
  attachments?: Attachment[];
}) {
  return (
    <div className={`w-full flex ${me ? "justify-end" : "justify-start"} my-1`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow ${
          me ? "bg-zinc-900 text-white rounded-br-md" : "bg-white border rounded-bl-md"
        }`}
      >
        {text && <div className="whitespace-pre-wrap leading-6">{text}</div>}

        {Array.isArray(attachments) && attachments.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {attachments.map((a, i) =>
              a.type === "image" ? (
                <a
                  key={i}
                  href={a.url || a.blobUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border bg-white"
                >
                  <img
                    src={a.blobUrl || a.url}
                    alt={a.name || "image"}
                    className="w-full h-32 object-cover"
                    loading="lazy"
                  />
                </a>
              ) : a.type === "audio" ? (
                <div key={i} className="rounded-lg border bg-white p-2">
                  <audio controls src={a.blobUrl || a.url} className="w-full" />
                  {a.name && <div className="mt-1 text-[11px] text-zinc-500">{a.name}</div>}
                </div>
              ) : null
            )}
          </div>
        )}

        {time && (
          <div className={`mt-1 text-[11px] ${me ? "text-zinc-300" : "text-zinc-500"}`}>
            {time}
          </div>
        )}
      </div>
    </div>
  );
}
