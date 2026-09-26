"use client";

import React, { useEffect, useState, use } from "react";
import { EmergencyContactDTO } from "@/modules/emergency/dto/emergency.dto";

interface PageProps {
  params: Promise<{ weddingId: string }>;
}

export default function EmergencyPage({ params }: PageProps) {
  const { weddingId } = use(params);

  const [contacts, setContacts] = useState<EmergencyContactDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContactDTO | null>(null);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [priority, setPriority] = useState(0);
  const [notes, setNotes] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/emergency-contacts`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setContacts(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch emergency contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/weddings/${weddingId}/emergency-contacts`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && !ignore) setContacts(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch emergency contacts:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [weddingId]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    try {
      const url = editingContact
        ? `/api/v1/weddings/${weddingId}/emergency-contacts/${editingContact.id}`
        : `/api/v1/weddings/${weddingId}/emergency-contacts`;
      const method = editingContact ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          phone,
          email,
          priority: Number(priority),
          notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        resetForm();
        fetchContacts();
      } else {
        alert(json.error?.message || "Failed to save contact");
      }
    } catch (err) {
      console.error("Save contact error:", err);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm("Are you sure you want to delete this emergency contact?")) return;
    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/emergency-contacts/${contactId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchContacts();
    } catch (err) {
      console.error("Delete contact error:", err);
    }
  };

  const resetForm = () => {
    setEditingContact(null);
    setName("");
    setRole("");
    setPhone("");
    setEmail("");
    setPriority(0);
    setNotes("");
  };

  return (
    <div className="space-y-space-md p-space-md max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm bg-surface-container-lowest p-space-md rounded-2xl border border-surface-container-high/60 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">Emergency Contacts</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Important contact directory for Pandit Ji, wedding planners, venue leads, and emergency coordination.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-primary-container text-on-primary hover:opacity-95 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Contact
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-on-surface-variant text-sm flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-[32px] animate-spin text-primary-container">progress_activity</span>
          Loading emergency contacts...
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-16 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-surface-container-high p-space-md">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">emergency</span>
          <h3 className="text-sm font-semibold text-on-surface mt-2">No Emergency Contacts Added</h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Add key contacts such as ceremony priests, transport managers, or medical leads.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-4 px-4 py-2 bg-primary-container text-on-primary rounded-xl text-xs font-semibold"
          >
            Add First Contact
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-bold text-[10px] uppercase">
                    {contact.role}
                  </span>
                  {contact.priority > 0 && (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                      Priority {contact.priority}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-on-surface mt-2">{contact.name}</h3>

                <div className="space-y-1.5 mt-3 text-xs text-on-surface-variant">
                  {contact.phone && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">call</span>
                      <a href={`tel:${contact.phone}`} className="hover:underline font-medium text-on-surface">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                      <a href={`mailto:${contact.email}`} className="hover:underline text-on-surface">
                        {contact.email}
                      </a>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <p className="text-xs text-on-surface-variant/80 mt-3 p-2 rounded-xl bg-surface-container/40 border border-surface-container-high/40">
                    {contact.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-3 border-t border-surface-container-high">
                <button
                  type="button"
                  onClick={() => {
                    setEditingContact(contact);
                    setName(contact.name);
                    setRole(contact.role);
                    setPhone(contact.phone || "");
                    setEmail(contact.email || "");
                    setPriority(contact.priority);
                    setNotes(contact.notes || "");
                    setShowModal(true);
                  }}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteContact(contact.id)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-space-md border border-surface-container-high shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-on-surface">
              {editingContact ? "Edit Emergency Contact" : "Add Emergency Contact"}
            </h2>
            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pandit Sharma"
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Role / Designation *</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Priest / Ceremony Lead"
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">Priority</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Internal Notes (Organiser Only)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private instructions or availability notes..."
                  className="w-full text-xs rounded-xl border border-surface-container-high bg-surface px-3 py-2 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:opacity-95"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
