import React, { useState } from "react";
import { useProjectParties } from "./hooks/useProjectParties";
import { useBranches } from "./hooks/useBranches";
import ProjectPartyFilters from "./components/ProjectPartyFilters";
import ProjectPartyTable from "./components/ProjectPartyTable";
import ProjectPartyFormModal from "./components/ProjectPartyFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

const ProjectParties = () => {
  const [typeFilter, setTypeFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const { branches } = useBranches();
  const { items, loading, error, addItem, editItem, removeItem } =
    useProjectParties(typeFilter, branchFilter);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      if (editingItem) {
        await editItem(editingItem.id, form);
      } else {
        await addItem(form);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeItem(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-5 [direction:rtl]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <h1 className="text-2xl font-bold text-mainColor">جهات المشاريع</h1>
        <button
          onClick={openAddModal}
          className="bg-mainColor text-white px-4 py-2 rounded-md hover:opacity-90 transition"
        >
          + إضافة جهة جديدة
        </button>
      </div>

      <ProjectPartyFilters
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        branchId={branchFilter}
        onBranchChange={setBranchFilter}
        branches={branches}
      />

      {error && (
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}

      <ProjectPartyTable
        items={items}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteId}
      />

      <ProjectPartyFormModal
        open={showModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        initialData={editingItem}
        branches={branches}
        saving={saving}
      />

      <DeleteConfirmModal
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
};

export default ProjectParties;