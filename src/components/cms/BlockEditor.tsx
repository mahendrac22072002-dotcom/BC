import React from "react";
import { PageBlock, BlockType } from "@/types/blocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

function RichTextEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[100px] border border-zinc-200 p-3 rounded-md",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1 border-b border-zinc-100 pb-2">
        <Button size="sm" variant="ghost" type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'bg-zinc-100' : ''}>B</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'bg-zinc-100' : ''}>I</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'bg-zinc-100' : ''}>U</Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function BlockEditor({ blocks, onChange }: { blocks: PageBlock[]; onChange: (b: PageBlock[]) => void }) {
  const moveBlock = (index: number, dir: 1 | -1) => {
    if (index + dir < 0 || index + dir >= blocks.length) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + dir];
    newBlocks[index + dir] = temp;
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    onChange(newBlocks);
  };

  const updateBlock = (index: number, partial: Partial<PageBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...partial };
    onChange(newBlocks);
  };

  const addBlock = (type: BlockType) => {
    const newBlock: PageBlock = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      data: {},
      items: [],
      content: "",
    };
    if (type === "hero") newBlock.data = { eyebrow: "New", title: "Hero Title", subtitle: "Subtitle here" };
    if (type === "grid") newBlock.data = { eyebrow: "Section", title: "Grid Section", columns: 3 };
    if (type === "columns") newBlock.data = { eyebrow: "Section", title: "Split Section" };
    onChange([...blocks, newBlock]);
  };

  return (
    <div className="space-y-6">
      {blocks.map((block, i) => (
        <div key={block.id} className="relative rounded-lg border border-zinc-200 bg-white p-4 shadow-sm group">
          <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button size="icon" variant="ghost" type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0}><ArrowUp className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1}><ArrowDown className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" type="button" onClick={() => removeBlock(i)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">{block.type} Block</div>
          
          {block.type === "rich-text" && (
            <RichTextEditor content={block.content || ""} onChange={(content) => updateBlock(i, { content })} />
          )}

          {block.type === "hero" && (
            <div className="space-y-3">
              <Input placeholder="Eyebrow text" value={block.data?.eyebrow || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, eyebrow: e.target.value } })} />
              <Input placeholder="Hero Title" value={block.data?.title || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, title: e.target.value } })} />
              <Textarea placeholder="Subtitle" value={block.data?.subtitle || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, subtitle: e.target.value } })} />
            </div>
          )}

          {block.type === "columns" && (
            <div className="space-y-3">
              <Input placeholder="Eyebrow text" value={block.data?.eyebrow || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, eyebrow: e.target.value } })} />
              <Input placeholder="Section Title" value={block.data?.title || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, title: e.target.value } })} />
              <div className="text-sm font-semibold mt-4">Left/Right Content Items</div>
              {/* Simplistic nested items logic for demo purposes */}
              <RichTextEditor content={block.items?.[0]?.content || ""} onChange={(content) => {
                 const items = [...(block.items || [])];
                 if (!items[0]) items[0] = { id: '1', type: 'rich-text', content: '' };
                 items[0].content = content;
                 updateBlock(i, { items });
              }} />
            </div>
          )}

          {block.type === "grid" && (
            <div className="space-y-3">
              <Input placeholder="Eyebrow text" value={block.data?.eyebrow || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, eyebrow: e.target.value } })} />
              <Input placeholder="Grid Title" value={block.data?.title || ""} onChange={(e) => updateBlock(i, { data: { ...block.data, title: e.target.value } })} />
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 border-t border-dashed border-zinc-200 pt-4">
        <Button size="sm" variant="outline" type="button" onClick={() => addBlock("hero")}><Plus className="mr-1 h-4 w-4" /> Hero</Button>
        <Button size="sm" variant="outline" type="button" onClick={() => addBlock("rich-text")}><Plus className="mr-1 h-4 w-4" /> Rich Text</Button>
        <Button size="sm" variant="outline" type="button" onClick={() => addBlock("columns")}><Plus className="mr-1 h-4 w-4" /> Split Layout</Button>
        <Button size="sm" variant="outline" type="button" onClick={() => addBlock("grid")}><Plus className="mr-1 h-4 w-4" /> Grid</Button>
      </div>
    </div>
  );
}
