import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function SupabaseTestPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 mb-4">
          <p className="font-semibold">Notice / تنبيه:</p>
          <p className="text-sm">{error.message}</p>
        </div>
      )}
      <ul className="space-y-2">
        {todos && todos.length > 0 ? (
          todos.map((todo: { id: string | number; name?: string; title?: string }) => (
            <li key={todo.id} className="p-3 bg-white border border-gray-200 rounded-md shadow-sm">
              {todo.name || todo.title || JSON.stringify(todo)}
            </li>
          ))
        ) : (
          <li className="text-muted text-sm">No items found or table is empty.</li>
        )}
      </ul>
    </div>
  );
}
