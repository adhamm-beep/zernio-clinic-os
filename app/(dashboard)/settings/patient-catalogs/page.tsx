"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinic } from "@/features/clinic/hooks/useClinic";
import {
  createPatientTag,
  getPatientTags,
  getReferralSources,
  saveReferralSource,
  updatePatientTag,
  type PatientTag,
  type ReferralSource,
} from "@/features/customers/api/customer.api";
import { usePermissionAccess } from "@/features/users/hooks/usePermissionAccess";

export default function PatientCatalogsPage() {
  const access = usePermissionAccess();
  const canManage = access.can("patient_catalogs.manage", "settings.manage");
  const { clinic } = useClinic();
  const clinicId = clinic?.id ?? 0;
  const qc = useQueryClient();
  const tags = useQuery({
    queryKey: ["patient-tags-settings", clinicId],
    queryFn: () => getPatientTags(clinicId, true),
    enabled: clinicId > 0,
  });
  const refs = useQuery({
    queryKey: ["referral-sources-settings", clinicId],
    queryFn: () => getReferralSources(clinicId, true),
    enabled: clinicId > 0,
  });
  const [tagDraft, setTagDraft] = useState({ name: "", color: "#0ea5e9" });
  const [refDraft, setRefDraft] = useState({
    name: "",
    color: "#22c55e",
    url: "",
    description: "",
  });
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["patient-tags"] }),
      qc.invalidateQueries({ queryKey: ["patient-tags-settings"] }),
      qc.invalidateQueries({ queryKey: ["referral-sources"] }),
      qc.invalidateQueries({ queryKey: ["referral-sources-settings"] }),
      qc.invalidateQueries({ queryKey: ["customers"] }),
    ]);
  };
  const addTag = useMutation({
    mutationFn: () => createPatientTag(clinicId, tagDraft.name, tagDraft.color),
    onSuccess: async () => {
      setTagDraft({ name: "", color: "#0ea5e9" });
      await refresh();
      toast.success("تمت إضافة العلامة");
    },
  });
  const saveTag = useMutation({
    mutationFn: (tag: PatientTag) => updatePatientTag(tag),
    onSuccess: refresh,
  });
  const addRef = useMutation({
    mutationFn: () =>
      saveReferralSource({
        clinic_id: clinicId,
        name: refDraft.name,
        color: refDraft.color,
        referral_url: refDraft.url,
        description: refDraft.description,
      }),
    onSuccess: async () => {
      setRefDraft({ name: "", color: "#22c55e", url: "", description: "" });
      await refresh();
      toast.success("تمت إضافة مصدر الإحالة");
    },
  });
  const saveRef = useMutation({
    mutationFn: (ref: ReferralSource) => saveReferralSource(ref),
    onSuccess: refresh,
  });
  if (!access.isLoading && !canManage)
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        إدارة علامات المرضى ومصادر الإحالة غير متوفرة لك حسب صلاحيات حسابك.
      </div>
    );
  if (!clinicId) return <div>اختر العيادة أولًا.</div>;
  return (
    <div className="space-y-5" dir="rtl">
      <header>
        <h1 className="text-3xl font-black">علامات المرضى ومصادر الإحالة</h1>
        <p className="text-slate-500">
          أي تعديل هنا يظهر فورًا في سجل المرضى ونماذج الإنشاء والتعديل وجميع
          أجزاء النظام.
        </p>
      </header>
      <Catalog title="علامات المرضى" icon={<Tags />}>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            value={tagDraft.name}
            onChange={(e) => setTagDraft({ ...tagDraft, name: e.target.value })}
            placeholder="اسم العلامة"
          />
          <input
            type="color"
            value={tagDraft.color}
            onChange={(e) =>
              setTagDraft({ ...tagDraft, color: e.target.value })
            }
            className="h-10 w-16 rounded border"
          />
          <Button
            disabled={!tagDraft.name.trim()}
            onClick={() => addTag.mutate()}
          >
            إضافة علامة
          </Button>
        </div>
        <div className="mt-4 grid gap-2">
          {tags.data?.map((tag) => (
            <TagRow
              key={tag.id}
              tag={tag}
              save={(value) => saveTag.mutate(value)}
            />
          ))}
        </div>
      </Catalog>
      <Catalog title="مصادر الإحالة" icon={<Link2 />}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_1fr_auto]">
          <Input
            value={refDraft.name}
            onChange={(e) => setRefDraft({ ...refDraft, name: e.target.value })}
            placeholder="اسم مصدر الإحالة"
          />
          <input
            type="color"
            value={refDraft.color}
            onChange={(e) =>
              setRefDraft({ ...refDraft, color: e.target.value })
            }
            className="h-10 w-16 rounded border"
          />
          <Input
            value={refDraft.url}
            onChange={(e) => setRefDraft({ ...refDraft, url: e.target.value })}
            placeholder="رابط اختياري"
          />
          <Input
            value={refDraft.description}
            onChange={(e) =>
              setRefDraft({ ...refDraft, description: e.target.value })
            }
            placeholder="الوصف"
          />
          <Button
            disabled={!refDraft.name.trim()}
            onClick={() => addRef.mutate()}
          >
            إضافة إحالة
          </Button>
        </div>
        <div className="mt-4 grid gap-2">
          {refs.data?.map((ref) => (
            <RefRow
              key={ref.id}
              source={ref}
              save={(value) => saveRef.mutate(value)}
            />
          ))}
        </div>
      </Catalog>
    </div>
  );
}
function Catalog({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}
function TagRow({
  tag,
  save,
}: {
  tag: PatientTag;
  save: (value: PatientTag) => void;
}) {
  const [draft, setDraft] = useState(tag);
  return (
    <div className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_auto_auto_auto]">
      <Input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <input
        type="color"
        value={draft.color}
        onChange={(e) => setDraft({ ...draft, color: e.target.value })}
        className="h-10 w-16 rounded border"
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
        />
        نشطة
      </label>
      <Button variant="outline" onClick={() => save(draft)}>
        حفظ
      </Button>
    </div>
  );
}
function RefRow({
  source,
  save,
}: {
  source: ReferralSource;
  save: (value: ReferralSource) => void;
}) {
  const [draft, setDraft] = useState(source);
  return (
    <div className="grid gap-2 rounded-xl border p-3 md:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_1fr_auto_auto]">
      <Input
        value={draft.name}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />
      <input
        type="color"
        value={draft.color}
        onChange={(e) => setDraft({ ...draft, color: e.target.value })}
        className="h-10 w-16 rounded border"
      />
      <Input
        value={draft.referral_url ?? ""}
        onChange={(e) => setDraft({ ...draft, referral_url: e.target.value })}
        placeholder="الرابط"
      />
      <Input
        value={draft.description ?? ""}
        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        placeholder="الوصف"
      />
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
        />
        نشطة
      </label>
      <Button variant="outline" onClick={() => save(draft)}>
        حفظ
      </Button>
    </div>
  );
}
