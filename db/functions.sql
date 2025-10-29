-- Vector similarity function: returns top matches by cosine similarity
create or replace function public.match_items(
  query_embedding vector(1536),
  limit_count int default 20
)
returns table (
  item_id uuid,
  similarity real
)
language sql stable as $$
  select ie.item_id,
         (1 - (ie.embedding <=> query_embedding))::real as similarity
  from public.item_embeddings ie
  order by ie.embedding <=> query_embedding asc
  limit limit_count;
$$;

