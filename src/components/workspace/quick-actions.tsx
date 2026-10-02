"use client";

import React from "react";
import { useQuickActions } from "./quick-actions-context";

export function QuickActions() {
  const { openQuickAction } = useQuickActions();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
      <h2 className="text-lg font-serif font-bold text-stone-900 tracking-tight">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={(e) => openQuickAction("ADD_CEREMONY", undefined, e.currentTarget)}
          className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-left transition-all space-y-1 group cursor-pointer"
        >
          <div className="text-xl">✨</div>
          <div className="text-xs font-bold text-stone-900 group-hover:text-[#800020]">
            Add Ceremony
          </div>
          <div className="text-[11px] text-stone-500">Schedule Haldi, Sangeet, etc.</div>
        </button>

        <button
          type="button"
          onClick={(e) => openQuickAction("CREATE_TASK", undefined, e.currentTarget)}
          className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-left transition-all space-y-1 group cursor-pointer"
        >
          <div className="text-xl">📝</div>
          <div className="text-xs font-bold text-stone-900 group-hover:text-[#800020]">
            Add Task
          </div>
          <div className="text-[11px] text-stone-500">Assign vendor / prep tasks</div>
        </button>

        <button
          type="button"
          onClick={(e) => openQuickAction("ADD_GUEST", undefined, e.currentTarget)}
          className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-left transition-all space-y-1 group cursor-pointer"
        >
          <div className="text-xl">💌</div>
          <div className="text-xs font-bold text-stone-900 group-hover:text-[#800020]">
            Add Guests
          </div>
          <div className="text-[11px] text-stone-500">Manage household guest list</div>
        </button>

        <button
          type="button"
          onClick={(e) => openQuickAction("INVITE_ORGANISER", undefined, e.currentTarget)}
          className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-left transition-all space-y-1 group cursor-pointer"
        >
          <div className="text-xl">👥</div>
          <div className="text-xs font-bold text-stone-900 group-hover:text-[#800020]">
            Invite Team
          </div>
          <div className="text-[11px] text-stone-500">Collaborate with family</div>
        </button>
      </div>
    </div>
  );
}
