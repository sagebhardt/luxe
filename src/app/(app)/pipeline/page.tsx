import { listPipelineCards } from "@/lib/queries/pipeline";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const cards = await listPipelineCards();
  return (
    <main className="pipeline-main">
      <div className="pipeline-header">
        <h1 className="pipeline-heading">Pipeline</h1>
        <p className="pipeline-sub">
          Where every client sits in the journey. Drag cards between columns
          to update their stage.
        </p>
      </div>
      <PipelineBoard initialCards={cards} />
    </main>
  );
}
