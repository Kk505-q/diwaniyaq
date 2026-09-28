import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { EditPermToggle } from "@/components/admin/EditPermToggle";
import { StudentNameList } from "@/components/admin/StudentNameList";

// Supervisor/admin panel to control name & alias editing permissions and to
// hide or delete a student's alias.
export async function StudentNameManager() {
  const [settings, students] = await Promise.all([
    getSettings(),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      select: { id: true, name: true, alias: true, aliasDisabled: true, canEditAlias: true, canEditName: true },
    }),
  ]);
  students.sort((a, b) => a.name.localeCompare(b.name, "ar"));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold">أسماء الطلاب والصلاحيات</h2>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <h3 className="text-sm font-bold">فتح التعديل للجميع</h3>
        <div className="flex flex-wrap gap-2">
          <EditPermToggle
            field="alias"
            scope="global"
            value={settings.allowAllEditAlias}
            label="تعديل الاسم المستعار للجميع"
          />
          <EditPermToggle
            field="name"
            scope="global"
            value={settings.allowAllEditName}
            label="تعديل الاسم الحقيقي للجميع"
          />
        </div>
        <p className="text-xs text-foreground/50">
          عند الفتح للجميع، يستطيع كل الطلاب التعديل بغضّ النظر عن الإعداد الفردي أدناه.
        </p>
      </div>

      <StudentNameList students={students} />
    </section>
  );
}
