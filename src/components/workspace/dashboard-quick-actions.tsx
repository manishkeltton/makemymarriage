"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useQuickActions } from "./quick-actions-context";

export function DashboardQuickActions() {
  const { openQuickAction } = useQuickActions();
  const t = useTranslations("Workspace");

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={(e) => openQuickAction("ADD_CEREMONY", undefined, e.currentTarget)}
        className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-primary-container">
          event
        </span>
        <span>{t("addCeremony")}</span>
      </button>

      <button
        type="button"
        onClick={(e) => openQuickAction("CREATE_TASK", undefined, e.currentTarget)}
        className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-primary-container">
          add_task
        </span>
        <span>{t("createTask")}</span>
      </button>

      <button
        type="button"
        onClick={(e) => openQuickAction("ADD_GUEST", undefined, e.currentTarget)}
        className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-primary-container">
          person_add
        </span>
        <span>{t("addGuestFamily")}</span>
      </button>

      <button
        type="button"
        onClick={(e) => openQuickAction("INVITE_ORGANISER", undefined, e.currentTarget)}
        className="h-[34px] px-3.5 rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-headline-sm text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-high/60 shadow-xs cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] text-primary-container">
          group_add
        </span>
        <span>{t("inviteOrganiser")}</span>
      </button>
    </div>
  );
}

export function AddFirstEventButton() {
  const { openQuickAction } = useQuickActions();
  const t = useTranslations("Workspace");

  return (
    <button
      type="button"
      onClick={(e) => openQuickAction("ADD_CEREMONY", undefined, e.currentTarget)}
      className="h-[42px] px-6 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-headline-sm text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
    >
      <span className="material-symbols-outlined text-[20px]">add</span>
      <span>{t("addFirstEvent")}</span>
    </button>
  );
}
