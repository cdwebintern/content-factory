const SHEET_ID = import.meta.env.VITE_SHEET_ID
const API_KEY = import.meta.env.VITE_SHEETS_API_KEY

// True only when both values exist in frontend/.env.local
export const SHEET_CONFIGURED = Boolean(SHEET_ID && API_KEY)

// Tab names with spaces or symbols must be wrapped in single quotes in A1 notation
const quoteTab = (tab) =>
  /^[A-Za-z0-9_]+$/.test(tab) ? tab : `'${tab.replace(/'/g, "''")}'`

async function describeError(res, tab) {
  let detail = ""
  try {
    detail = (await res.json())?.error?.message ?? ""
  } catch {
    // The error body wasn't JSON, so just use the status code
  }

  if (res.status === 400) {
    return `Google rejected the request (${detail || "bad request"}). Check that a tab named "${tab}" exists and that VITE_SHEETS_API_KEY is correct.`
  }
  if (res.status === 403) {
    return 'Google refused the request. Check that the Sheets API is enabled, the API key allows this website, and the sheet is shared as "Anyone with the link: Viewer".'
  }
  if (res.status === 404) {
    return "Google could not find the spreadsheet. Check VITE_SHEET_ID."
  }
  if (res.status === 429) {
    return "Too many requests to Google. Wait a minute, then refresh."
  }
  return `Google returned an error (${res.status}). ${detail}`
}

// Returns the rows of one tab as an array of arrays (row 1 is the header)
export async function fetchRange(tab, cells, signal) {
  const range = `${quoteTab(tab)}!${cells}`
  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(SHEET_ID)}` +
    `/values/${encodeURIComponent(range)}?key=${encodeURIComponent(API_KEY)}`

  let res
  try {
    res = await fetch(url, { signal, cache: "no-store" })
  } catch (err) {
    if (err.name === "AbortError") throw err
       throw new Error("Could not reach Google. Check your internet connection.", { cause: err })
  }

  if (!res.ok) throw new Error(await describeError(res, tab))

  const data = await res.json()
  return data.values ?? []
}