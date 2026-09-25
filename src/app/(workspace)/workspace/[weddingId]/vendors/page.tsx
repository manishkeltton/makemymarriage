"use client";

import React, { useState, useEffect, useCallback, use } from "react";
import { VendorDTO, VENDOR_CATEGORIES } from "@/modules/vendors/dto/vendor.dto";
import { EventDTO } from "@/modules/events/dto/event.dto";
import { VendorFormModal } from "@/components/vendors/VendorFormModal";
import { formatINR } from "@/lib/utils/money";

interface VendorsPageProps {
  params: Promise<{ weddingId: string }>;
}

export default function VendorsPage({ params }: VendorsPageProps) {
  const { weddingId } = use(params);

  const [vendors, setVendors] = useState<VendorDTO[]>([]);
  const [events, setEvents] = useState<EventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDTO | null>(null);

  const fetchVendorsData = useCallback(async () => {
    try {
      const query = new URLSearchParams({ limit: "200" });
      if (selectedCategory) query.append("category", selectedCategory);
      if (searchQuery.trim()) query.append("q", searchQuery.trim());

      const [vendorsRes, eventsRes] = await Promise.all([
        fetch(`/api/v1/weddings/${weddingId}/vendors?${query.toString()}`),
        fetch(`/api/v1/weddings/${weddingId}/events`),
      ]);

      const vendorsData = await vendorsRes.json();
      const eventsData = await eventsRes.json();

      if (vendorsData.success) {
        setVendors(vendorsData.data || []);
      } else {
        setError(vendorsData.error?.message || "Failed to load vendors.");
      }

      if (eventsData.success) {
        setEvents(eventsData.data || []);
      }
    } catch (err: unknown) {
      console.error("Error fetching vendors:", err);
      setError("Failed to load vendor directory.");
    } finally {
      setLoading(false);
    }
  }, [weddingId, selectedCategory, searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (isMounted) {
        await fetchVendorsData();
      }
    };
    void load();

    return () => {
      isMounted = false;
    };
  }, [fetchVendorsData]);

  const handleCreateNew = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const handleEdit = (vendor: VendorDTO) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const handleDelete = async (vendor: VendorDTO) => {
    if (!confirm(`Are you sure you want to remove vendor "${vendor.name}"?`)) return;

    try {
      const res = await fetch(`/api/v1/weddings/${weddingId}/vendors/${vendor.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVendors(vendors.filter((v) => v.id !== vendor.id));
      } else {
        alert(data.error?.message || "Failed to delete vendor.");
      }
    } catch (err: unknown) {
      console.error("Error deleting vendor:", err);
      alert("Failed to delete vendor.");
    }
  };

  const handleModalSuccess = () => {
    fetchVendorsData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif text-on-surface">Vendor Directory</h1>
          <p className="text-sm text-on-surface-variant">
            Manage your wedding vendors, contracts, agreed budgets, and ceremony bookings.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary font-medium text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Vendor
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
            search
          </span>
          <input
            type="text"
            placeholder="Search vendors by name or contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3.5 py-2.5 bg-surface-container-low border border-outline/30 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {VENDOR_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Vendors List / Grid */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-on-surface-variant gap-3">
          <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
          <span className="text-sm font-medium">Loading vendor directory...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      ) : vendors.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl p-12 border border-surface-container-high text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary-container/30 text-primary flex items-center justify-center mx-auto text-3xl">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-on-surface font-serif">No Vendors Found</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Add your shortlisted vendors, decorators, caterers, and photographers to manage contracts and payments.
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((vendor) => {
            const agreedPaise = vendor.agreedAmountPaise || 0;
            const paidPaise = vendor.financials?.totalPaidPaise || 0;
            const outstandingPaise = vendor.financials?.totalOutstandingPaise || 0;

            return (
              <div
                key={vendor.id}
                className="bg-surface-container-lowest rounded-2xl p-5 border border-surface-container-high hover:border-outline/40 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant text-[11px] font-bold tracking-wider uppercase">
                        {vendor.category.replace("_", " ")}
                      </span>
                      <h3 className="text-lg font-bold text-on-surface font-serif mt-1">{vendor.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(vendor)}
                        className="p-1 text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-lg transition-colors"
                        title="Edit Vendor"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(vendor)}
                        className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors"
                        title="Delete Vendor"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-on-surface-variant">
                    {vendor.contactPerson && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">person</span>
                        <span>{vendor.contactPerson}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">call</span>
                        <a href={`tel:${vendor.phone}`} className="hover:underline font-mono">
                          {vendor.phone}
                        </a>
                      </div>
                    )}
                    {vendor.email && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">mail</span>
                        <a href={`mailto:${vendor.email}`} className="hover:underline truncate">
                          {vendor.email}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Linked Ceremonies */}
                  {vendor.events && vendor.events.length > 0 && (
                    <div className="pt-2 border-t border-surface-container">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/70 mb-1">
                        Ceremonies
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {vendor.events.map((ev) => (
                          <span
                            key={ev.id}
                            className="px-2 py-0.5 rounded-md bg-secondary-container/40 text-on-secondary-container text-[11px] font-medium"
                          >
                            {ev.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Footer */}
                <div className="mt-4 pt-3 border-t border-surface-container-high space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-medium">Agreed Budget:</span>
                    <span className="font-bold text-on-surface font-mono">
                      {agreedPaise > 0 ? formatINR(agreedPaise) : "Not set"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-medium">Paid:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {formatINR(paidPaise)}
                    </span>
                  </div>

                  {outstandingPaise > 0 && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-on-surface-variant font-medium">Outstanding:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                        {formatINR(outstandingPaise)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vendor Form Modal */}
      <VendorFormModal
        isOpen={isModalOpen}
        weddingId={weddingId}
        vendor={editingVendor}
        events={events}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
