#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_dir="$(cd "${script_dir}/.." && pwd)"
source_pdf="${RESUME_SOURCE_PDF:-${HOME}/Documents/Resumes/David_Daniliuc_resume.pdf}"
target_pdf="${repo_dir}/public/resume.pdf"

if [[ $# -gt 1 ]] || [[ $# -eq 1 && "$1" != "--check" ]]; then
  echo "Usage: $0 [--check]" >&2
  exit 2
fi
if [[ ! -f "${source_pdf}" ]]; then
  echo "Missing source: ${source_pdf}" >&2
  exit 1
fi
if [[ "$(head -c 5 "${source_pdf}")" != "%PDF-" ]]; then
  echo "Source is not a PDF: ${source_pdf}" >&2
  exit 1
fi
if [[ -f "${target_pdf}" ]] && cmp -s "${source_pdf}" "${target_pdf}"; then
  echo "Current: resume.pdf"
  exit 0
fi
if [[ "${1:-}" == "--check" ]]; then
  echo "Out of date: resume.pdf"
  exit 1
fi

mkdir -p "${repo_dir}/public"
temporary_file="$(mktemp "${target_pdf}.tmp.XXXXXX")"
trap 'if [[ -f "${temporary_file}" ]]; then unlink "${temporary_file}"; fi' EXIT
cp "${source_pdf}" "${temporary_file}"
chmod 0644 "${temporary_file}"
mv "${temporary_file}" "${target_pdf}"
echo "Updated: resume.pdf"
