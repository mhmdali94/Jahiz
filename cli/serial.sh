#!/usr/bin/env bash
# Arabic interactive menu around serial.js, which does the actual crypto and
# ledger bookkeeping. Run bare for the menu; pass flags to script it
# (./serial.sh new 20, ./serial.sh list, ...). Works fully offline — this
# never makes a network call, it only ever touches local files.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

NODE_CLI=(node cli/serial.js)

BOLD='\033[1m'
CYAN='\033[36m'
RED='\033[31m'
RESET='\033[0m'

pause() {
  echo
  read -r -p "اضغط Enter للمتابعة..." _
}

print_header() {
  echo -e "${CYAN}════════════════════════════════${RESET}"
  echo -e "${BOLD}   إدارة سريالات نموذج العملاء${RESET}"
  echo -e "${CYAN}════════════════════════════════${RESET}"
  echo "  1) إصدار سريالات جديدة (دفعة)"
  echo "  2) إصدار سريال مخصص لعميل"
  echo "  3) عرض السريالات المتاحة"
  echo "  4) حذف سريال"
  echo "  5) عرض السريالات المحذوفة"
  echo "  6) خروج"
  echo -e "${CYAN}────────────────────────────────${RESET}"
}

action_bulk() {
  local count
  while true; do
    read -r -p "كم عدد السريالات المطلوب إصدارها؟ " count
    [[ "$count" =~ ^[0-9]+$ && "$count" -gt 0 ]] && break
    echo -e "${RED}الرجاء إدخال رقم صحيح أكبر من صفر.${RESET}"
  done
  "${NODE_CLI[@]}" bulk "$count"
  pause
}

prompt_project_type() {
  # Everything here except the final result `echo` goes to stderr — this
  # function's stdout is captured via $(...) by the caller, so any plain
  # echo would silently corrupt the returned value with menu text.
  echo "نوع المشروع:" >&2
  echo "  1) موقع جديد" >&2
  echo "  2) ترحيل موقع قائم" >&2
  echo "  3) إعادة تصميم" >&2
  echo "  4) إنشاء بريد إلكتروني جديد" >&2
  echo "  5) ترحيل بريد إلكتروني قائم" >&2
  echo "  6) تخطّي (العميل يختار بنفسه)" >&2
  local choice
  while true; do
    read -r -p "اختر رقماً: " choice
    case "$choice" in
      1) echo "new"; return ;;
      2) echo "migration"; return ;;
      3) echo "redesign"; return ;;
      4) echo "email_new"; return ;;
      5) echo "email_migration"; return ;;
      6) echo ""; return ;;
      *) echo -e "${RED}اختيار غير صحيح.${RESET}" >&2 ;;
    esac
  done
}

prompt_tracks() {
  echo "المسارات المفعّلة:" >&2
  echo "  1) التسليم التقني فقط" >&2
  echo "  2) محتوى الموقع فقط" >&2
  echo "  3) كلاهما" >&2
  echo "  4) تخطّي (العميل يختار بنفسه)" >&2
  local choice
  while true; do
    read -r -p "اختر رقماً: " choice
    case "$choice" in
      1) echo "A"; return ;;
      2) echo "B"; return ;;
      3) echo "AB"; return ;;
      4) echo ""; return ;;
      *) echo -e "${RED}اختيار غير صحيح.${RESET}" >&2 ;;
    esac
  done
}

action_issue() {
  local client_ar client_en type tracks
  while true; do
    read -r -p "اسم العميل (عربي، إلزامي): " client_ar
    [[ -n "$client_ar" ]] && break
    echo -e "${RED}هذا الحقل مطلوب.${RESET}"
  done
  read -r -p "اسم العميل (إنجليزي، اختياري): " client_en
  type=$(prompt_project_type)
  tracks=$(prompt_tracks)

  local args=(issue --client-ar "$client_ar")
  [[ -n "$client_en" ]] && args+=(--client "$client_en")
  [[ -n "$type" ]] && args+=(--type "$type")
  [[ -n "$tracks" ]] && args+=(--tracks "$tracks")
  "${NODE_CLI[@]}" "${args[@]}"
  pause
}

action_list() {
  "${NODE_CLI[@]}" list
  pause
}

action_delete() {
  "${NODE_CLI[@]}" list
  echo
  local target
  read -r -p "اختر رقم السريال المراد حذفه أو الصق معرّفه (أو اتركه فارغاً للإلغاء): " target
  [[ -z "$target" ]] && return
  local confirm
  read -r -p "$(echo -e "${RED}هل أنت متأكد من حذف هذا السريال؟ لا يمكن التراجع مباشرة. (y/N): ${RESET}")" confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    "${NODE_CLI[@]}" delete "$target" --yes
  else
    echo "تم الإلغاء."
  fi
  pause
}

action_list_deleted() {
  "${NODE_CLI[@]}" list-deleted
  echo
  local target
  read -r -p "رقم السريال لاستعادته (أو اتركه فارغاً للتخطي): " target
  [[ -n "$target" ]] && "${NODE_CLI[@]}" restore "$target"
  pause
}

run_menu() {
  while true; do
    clear 2>/dev/null || true
    print_header
    local choice
    read -r -p "اختر رقماً: " choice
    case "$choice" in
      1) action_bulk ;;
      2) action_issue ;;
      3) action_list ;;
      4) action_delete ;;
      5) action_list_deleted ;;
      6) echo "إلى اللقاء."; exit 0 ;;
      *) echo -e "${RED}اختيار غير صحيح — حاول مرة أخرى.${RESET}"; pause ;;
    esac
  done
}

if [[ $# -eq 0 ]]; then
  run_menu
else
  exec "${NODE_CLI[@]}" "$@"
fi
