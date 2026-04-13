import { notFound } from "next/navigation";
import Link from "next/link";
import { getBatchById, getCurrentUserRole } from "@/app/admin/batches/actions";
import { BatchDetail } from "@/components/batches/BatchDetail";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BatchDetailPage({ params }: Props) {
  const { id } = await params;

  let batch;
  try {
    batch = await getBatchById(id);
  } catch {
    notFound();
  }

  const { isAdmin } = await getCurrentUserRole();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <Link href="/admin/batches">
        <Button variant="ghost" className="w-fit -ml-2">
          <ArrowLeftIcon className="size-4 mr-1" />
          Back to Batches
        </Button>
      </Link>
      <BatchDetail batch={batch} isAdmin={isAdmin} />
    </div>
  );
}
