const SUPABASE_URL = "https://kbmetpgeqyyydddnflwt.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Sh_m6ks95-WvAN_Z7Vt5gg_ij2TLy8A";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("Supabase接続準備OK");
async function testSupabaseConnection() {
  const { data, error } = await supabaseClient
    .from("sales_cases")
    .select("id")
    .limit(1);

  if (error) {
    console.error(
      "Supabaseデータベース接続エラー:",
      error.message
    );
    return;
  }

  console.log(
    "Supabaseデータベース接続OK",
    data
  );
}

testSupabaseConnection();