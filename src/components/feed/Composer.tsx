"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/primitives/Icon";
import { FLAIR_LABEL } from "@/components/primitives/Flair";
import { useToast } from "@/components/primitives/ToastHost";
import { addPost } from "@/app/actions/posts";

const FLAIR_CHOICES = ["question", "discussion", "tips", "vent", "success", "update"]; // poll deferred

export function Composer({ scope, onClose }: { scope: string; onClose: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const [flair, setFlair] = useState("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const canPost = title.trim().length > 3;

  const submit = async () => {
    if (!canPost || busy) return;
    setBusy(true);
    const res = await addPost(scope, { flair, title, body });
    setBusy(false);
    if (!res.ok) {
      toast(res.error, { icon: "x" });
      return;
    }
    toast("Posted to the thread", { icon: "check", tone: "good" });
    onClose();
    router.refresh();
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="composer" onClick={(e) => e.stopPropagation()}>
        <div className="composer-head">
          <h3>Create post</h3>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="composer-body">
          <label className="composer-label">Flair</label>
          <div className="flair-picker">
            {FLAIR_CHOICES.map((f) => (
              <button key={f} className={"flair-chip flair-" + f + (flair === f ? " on" : "")} onClick={() => setFlair(f)}>
                {FLAIR_LABEL[f]}
              </button>
            ))}
          </div>
          <label className="composer-label">Title</label>
          <input
            className="composer-input"
            value={title}
            maxLength={120}
            autoFocus
            placeholder="what's on your mind?"
            onChange={(e) => setTitle(e.target.value)}
          />
          <label className="composer-label">
            Body <span className="opt">optional</span>
          </label>
          <textarea
            className="composer-textarea"
            value={body}
            maxLength={600}
            placeholder="add detail, context, the gory specifics…"
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="composer-foot">
          <span className="composer-note">Posts are anonymous. Be cool — the next class is reading.</span>
          <button className={"primary-btn" + (canPost && !busy ? "" : " disabled")} onClick={submit}>
            {busy ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
