#!/usr/bin/env python3
"""
Organize 3 sources of Sem 7 material into a single unified sem-7 folder.
V2 — Properly categorizes files by understanding naming conventions:
  - Professor initials (HBS, HMP, SST, VMT, PVP, SPT, HKS, MAS, BDP, SAD, MJL, NJK, PDD, PGD, DKR, YKM)
  - Phase/Sessional numbers (p1/p2/p3, phase1/phase2/phase3, 1st/2nd/3rd)
  - File types (assignments, PYQ, notes, textbooks, solutions)
"""

import os
import shutil
from pathlib import Path

BASE = Path("/media/rudra/New Volume/DDU material")
SRC_RM = BASE / "SEM7.rm"
SRC_AF = BASE / "Sem7.af"
SRC_RT = BASE / "Sem7.rt"
DEST = BASE / "sem-7"

copied = 0
collisions = 0


def safe_copy(src: Path, dst: Path, source_tag: str):
    """Copy a file, handling collisions by appending source tag."""
    global copied, collisions
    dst.parent.mkdir(parents=True, exist_ok=True)

    if dst.exists():
        if dst.stat().st_size == src.stat().st_size:
            return  # Skip true duplicates
        stem = dst.stem
        suffix = dst.suffix
        new_name = f"{stem} [{source_tag}]{suffix}"
        dst = dst.parent / new_name
        collisions += 1

    if not dst.exists():
        shutil.copy2(str(src), str(dst))
        copied += 1


def copy_tree(src_dir: Path, dst_dir: Path, source_tag: str):
    """Recursively copy a directory tree preserving structure."""
    if not src_dir.exists():
        return
    for item in src_dir.rglob("*"):
        if item.is_file():
            rel = item.relative_to(src_dir)
            safe_copy(item, dst_dir / rel, source_tag)


# ---- Subject detection helpers ----

SUBJECT_KEYWORDS = {
    "CTCT": ["ctct", "communication theory", "coding technique"],
    "CVML": ["cvml", "computer vision", "machine learning", "image processing", "digital image"],
    "DCC":  ["dcc", "data communication", "computer network", "data and computer"],
    "EMB":  ["emb", "embedded", "arm cortex"],
    "WLC":  ["wlc", "wireless", "rappaport"],
}

# Professor → Subject mapping
PROF_SUBJECT = {
    "sst": "CTCT", "vmt": "CTCT", "hbs": "CTCT", "hmp": "CTCT",
    "pvp": "CVML", "spt": "CVML", "ykm": "CVML",
    "bdp": "DCC",  "sad": "DCC",  "pdd": "DCC",  "dkr": "DCC", "tvs": "DCC",
    "mjl": "EMB",  "njk": "EMB",  "mkp": "EMB",
    "hks": "WLC",  "mas": "WLC",  "pgd": "WLC",
}


def detect_subject(filename: str, parent_path: str = "") -> str | None:
    """Detect subject from filename or parent directory."""
    combined = (filename + " " + parent_path).lower()

    # Check direct subject keywords in filename or path
    for subject, keywords in SUBJECT_KEYWORDS.items():
        for kw in keywords:
            if kw in combined:
                return subject

    # Check professor initials in filename
    fname_lower = filename.lower().replace("_", " ").replace("-", " ")
    for prof, subject in PROF_SUBJECT.items():
        # Match as whole word-ish: "hks notes" or "HKS_1" but not "dhks"
        tokens = fname_lower.split()
        for token in tokens:
            if token == prof or token.startswith(prof + " ") or fname_lower.startswith(prof):
                return subject

    return None


def detect_sessional(filename: str, parent_path: str = "") -> str | None:
    """Detect which sessional/phase from filename or path."""
    combined = (filename + " " + parent_path).lower()
    
    if any(x in combined for x in ["phase1", "phase 1", "p1", "1st sessional", "first sessional", "1st sess"]):
        return "First Sessional"
    if any(x in combined for x in ["phase2", "phase 2", "p2", "2nd sessional", "second sessional", "2nd sess"]):
        return "Second Sessional"
    if any(x in combined for x in ["phase3", "phase 3", "p3", "3rd sessional", "third sessional", "3rd sess"]):
        return "Third Sessional"
    return None


def detect_type(filename: str) -> str:
    """Detect file type category."""
    fl = filename.lower()
    if any(x in fl for x in ["pyq", "prev yr", "prev year", "previous year", "external 20", "sessionals-sem", "externals-sem"]):
        return "PYQ"
    if any(x in fl for x in ["assignment", "ass-", "ass_", "ass.", "tutorial"]):
        return "Assignments"
    if any(x in fl for x in ["solution", "soln"]):
        return "Solutions"
    if any(x in fl for x in ["textbook", "tb_", "t1_", "lathi", "rappaport", "tanenbaum", "gonzalez", "khalid sayood", "solution_manual", "solution_mannual"]):
        return "Textbooks"
    if any(x in fl for x in ["teaching plan", "teachingplan", "teaching_plan", "teachingscheme"]):
        return "Teaching Plan"
    if any(x in fl for x in ["lab manual", "lab_manual", "labmanual"]):
        return "Lab Manual"
    if any(x in fl for x in ["syllabus", "syallbus"]):
        return "Syllabus"
    return "Notes"


# ============================================================
# Phase 1: SEM7.rm — Best organized, copy structure as-is
# ============================================================
print("=" * 60)
print("Phase 1: SEM7.rm (base structure — already well organized)")
print("=" * 60)

for subject in ["CTCT", "CVML", "DCC", "EMB", "WLC"]:
    src = SRC_RM / subject
    if src.exists():
        print(f"  📁 {subject}...")
        copy_tree(src, DEST / subject, "rm")

src = SRC_RM / "ENTREPRENEURSHIP & IP"
if src.exists():
    print("  📁 Entrepreneurship & IP...")
    copy_tree(src, DEST / "Entrepreneurship & IP", "rm")

src = SRC_RM / "SIP"
if src.exists():
    print("  📁 SIP...")
    copy_tree(src, DEST / "SIP", "rm")

src = SRC_RM / "SENIOR"
if src.exists():
    print("  📁 Senior Material (large, may take a moment)...")
    copy_tree(src, DEST / "Senior Material" / "From RM", "rm")

p1 = copied
print(f"  ✅ Phase 1: {p1} files\n")


# ============================================================
# Phase 2: Sem7.af — Phase notes, classroom, journals
# ============================================================
print("=" * 60)
print("Phase 2: Sem7.af (phase notes, classroom materials)")
print("=" * 60)

# Phase Notes — categorize by professor → subject
for phase_name in ["Phase 1 Notes", "Phase 2 Notes", "Phase 3 Notes"]:
    phase_dir = SRC_AF / phase_name
    if not phase_dir.exists():
        continue
    
    # Map phase folder name to sessional
    sessional_map = {
        "Phase 1 Notes": "First Sessional",
        "Phase 2 Notes": "Second Sessional",
        "Phase 3 Notes": "Third Sessional",
    }
    sessional = sessional_map[phase_name]
    print(f"  📝 {phase_name}...")
    
    for f in phase_dir.iterdir():
        if not f.is_file():
            continue
        subject = detect_subject(f.name)
        if subject:
            safe_copy(f, DEST / subject / sessional / f"Notes ({phase_name})" / f.name, "af")
        else:
            safe_copy(f, DEST / "Misc" / phase_name / f.name, "af")

# Classroom materials — already organized by subject
src = SRC_AF / "Sem-7 Prev Classroom"
if src.exists():
    print("  🏫 Previous Classroom Materials...")
    for sub_dir in src.iterdir():
        if sub_dir.is_dir():
            subject = sub_dir.name.upper()
            if subject in ["CVML", "EMB", "DCC", "CTCT", "WLC"]:
                copy_tree(sub_dir, DEST / subject / "Classroom Materials", "af")
            else:
                copy_tree(sub_dir, DEST / sub_dir.name / "Classroom Materials", "af")

# Journals
src = SRC_AF / "Journals"
if src.exists():
    print("  📓 Journals...")
    copy_tree(src, DEST / "Journals", "af")

# Project / SIP
src = SRC_AF / "Project"
if src.exists():
    print("  📋 Project Reports...")
    copy_tree(src, DEST / "SIP" / "Project Reports", "af")

# Root files from Sem7.af
print("  📄 Root files...")
for f in SRC_AF.iterdir():
    if not f.is_file():
        continue
    fl = f.name.lower()
    
    # Keil project files → EMB Lab
    if f.suffix.lower() in [".uvgui", ".uvopt", ".uvproj"] or f.name.startswith("EC052"):
        safe_copy(f, DEST / "EMB" / "Lab Files" / f.name, "af")
        continue
    
    # Prev Yr Papers
    if "prev yr" in fl:
        safe_copy(f, DEST / "Previous Year Papers" / f.name, "af")
        continue
    
    # Sessional papers (e.g., "cvml sessionals 2025.pdf")
    if "sessional" in fl:
        subject = detect_subject(f.name)
        if subject:
            safe_copy(f, DEST / subject / "PYQ" / f.name, "af")
        else:
            safe_copy(f, DEST / "Previous Year Papers" / f.name, "af")
        continue
    
    # Entrepreneurship pptx
    if "entrepreneurship" in fl or "ent_ip" in fl or "ip patent" in fl:
        safe_copy(f, DEST / "Entrepreneurship & IP" / f.name, "af")
        continue
    
    # Everything else
    subject = detect_subject(f.name)
    if subject:
        safe_copy(f, DEST / subject / f.name, "af")
    else:
        safe_copy(f, DEST / "Misc" / f.name, "af")

# Empty dirs (Listings, Objects) — skip if empty
for d in ["Listings", "Objects"]:
    src = SRC_AF / d
    if src.exists():
        files = list(src.rglob("*"))
        if any(f.is_file() for f in files):
            copy_tree(src, DEST / "EMB" / "Lab Files" / d, "af")

p2 = copied - p1
print(f"  ✅ Phase 2: {p2} files\n")


# ============================================================
# Phase 3: Sem7.rt — Most complex, needs careful categorization
# ============================================================
print("=" * 60)
print("Phase 3: Sem7.rt (textbooks, lab code, extra notes)")
print("=" * 60)

# Direct subject folders — these contain notes, textbooks, solutions
for subject in ["CTCT", "CVML", "DCC", "EMB", "WLC"]:
    src = SRC_RT / subject
    if not src.exists():
        continue
    print(f"  📁 {subject}...")
    for f in src.rglob("*"):
        if not f.is_file():
            continue
        rel = f.relative_to(src)
        ftype = detect_type(f.name)
        sessional = detect_sessional(f.name, str(rel))
        
        # Determine destination subfolder
        if ftype == "Textbooks":
            dest_sub = DEST / subject / "Textbooks" / rel.parent / f.name if len(rel.parts) > 1 else DEST / subject / "Textbooks" / f.name
        elif sessional and len(rel.parts) <= 1:
            # File is directly in subject root with a sessional hint
            dest_sub = DEST / subject / sessional / f.name
        else:
            # Preserve the subfolder structure from source (e.g., PHASE3/)
            dest_sub = DEST / subject / rel
        safe_copy(f, dest_sub, "rt")

# Entrepreneurship and IP
src = SRC_RT / "Entrepreneurship and IP"
if src.exists():
    print("  📁 Entrepreneurship & IP...")
    copy_tree(src, DEST / "Entrepreneurship & IP", "rt")

# CVML Practicals (Python scripts, test images)
src = SRC_RT / "CVML_PRACTICAL_PRACTICE"
if src.exists():
    print("  🔬 CVML Practicals...")
    copy_tree(src, DEST / "CVML" / "Practicals", "rt")

# EMB Lab Code (Keil projects)
src = SRC_RT / "EMB_LAB"
if src.exists():
    print("  🔬 EMB Lab Code...")
    copy_tree(src, DEST / "EMB" / "Lab Code", "rt")

# EMB Practical Practice
src = SRC_RT / "emb_practical_practice"
if src.exists():
    print("  🔬 EMB Practicals...")
    copy_tree(src, DEST / "EMB" / "Practicals", "rt")

# "Sem 7 Prev Yr" — ACTUALLY professor notes by phase, NOT PYQs!
# Categorize each file by subject + sessional
src = SRC_RT / "Sem 7 Prev Yr"
if src.exists():
    print("  📝 Senior Notes (Sem 7 Prev Yr — professor notes by phase)...")
    for f in src.rglob("*"):
        if not f.is_file():
            continue
        fl = f.name.lower()
        subject = detect_subject(f.name)
        sessional = detect_sessional(f.name)
        ftype = detect_type(f.name)
        
        # Actual PYQ papers (sessionals/externals compilations)
        if "sessionals-sem" in fl or "externals-sem" in fl or "prev yr papers" in fl:
            safe_copy(f, DEST / "Previous Year Papers" / f.name, "rt")
        elif subject:
            if ftype == "Textbooks":
                safe_copy(f, DEST / subject / "Textbooks" / f.name, "rt")
            elif ftype == "Assignments":
                folder = sessional if sessional else "Assignments"
                safe_copy(f, DEST / subject / folder / f.name, "rt")
            elif sessional:
                safe_copy(f, DEST / subject / sessional / f.name, "rt")
            else:
                safe_copy(f, DEST / subject / "Notes" / f.name, "rt")
        else:
            # Can't determine subject — check for scanned docs
            if "scan" in fl or "doc-2024" in fl:
                safe_copy(f, DEST / "Misc" / "Scanned Notes" / f.name, "rt")
            elif "entrepreneurship" in fl or "ent_ip" in fl or "ip patent" in fl:
                safe_copy(f, DEST / "Entrepreneurship & IP" / f.name, "rt")
            else:
                safe_copy(f, DEST / "Misc" / "Unsorted Notes" / f.name, "rt")

# "SEM_7" subfolder — organized by sessional → subject, merge into main subjects
src = SRC_RT / "SEM_7"
if src.exists():
    print("  📁 SEM_7 (sessional-organized notes)...")
    for f in src.rglob("*"):
        if not f.is_file():
            continue
        rel_parts = f.relative_to(src).parts
        fl = f.name.lower()
        
        # Try to get subject from parent directory names
        subject = None
        sessional = None
        for part in rel_parts:
            pl = part.lower()
            if pl in ["ctct"]:
                subject = "CTCT"
            elif pl in ["cvml"]:
                subject = "CVML"
            elif pl in ["dcc"]:
                subject = "DCC"
            elif pl in ["embedded", "embb", "emb"]:
                subject = "EMB"
            elif pl in ["wlc"]:
                subject = "WLC"
            if "1st" in pl:
                sessional = "First Sessional"
            elif "2nd" in pl:
                sessional = "Second Sessional"
            elif "3rd" in pl:
                sessional = "Third Sessional"
        
        # Fallback to filename detection
        if not subject:
            subject = detect_subject(f.name)
        if not sessional:
            sessional = detect_sessional(f.name)
        
        if subject:
            if sessional:
                safe_copy(f, DEST / subject / sessional / f.name, "rt-sem7")
            else:
                ftype = detect_type(f.name)
                if ftype == "Textbooks":
                    safe_copy(f, DEST / subject / "Textbooks" / f.name, "rt-sem7")
                else:
                    safe_copy(f, DEST / subject / "Notes" / f.name, "rt-sem7")
        elif "entrepreneurship" in fl or "ent_ip" in fl or "ip patent" in fl:
            safe_copy(f, DEST / "Entrepreneurship & IP" / f.name, "rt-sem7")
        else:
            safe_copy(f, DEST / "Misc" / "SEM_7 Unsorted" / f.name, "rt-sem7")

# "External_Sem7_all notes" — combined notes per subject for externals
src = SRC_RT / "External_Sem7_all notes"
if src.exists():
    print("  📚 External Combined Notes...")
    for f in src.iterdir():
        if not f.is_file():
            continue
        fl = f.name.lower()
        subject = detect_subject(f.name)
        if "external papers" in fl or "prev year" in fl:
            safe_copy(f, DEST / "Previous Year Papers" / f.name, "rt")
        elif subject:
            safe_copy(f, DEST / subject / "External Exam Notes" / f.name, "rt")
        else:
            safe_copy(f, DEST / "Misc" / f.name, "rt")

# "New folder" — Lab practicals organized by subject
src = SRC_RT / "New folder"
if src.exists():
    print("  📁 New folder (lab practicals)...")
    for item in src.iterdir():
        if item.is_dir():
            subject_name = item.name.upper()
            if subject_name in ["CVML", "EMB", "DCC"]:
                copy_tree(item, DEST / subject_name / "Lab Practicals", "rt")
            else:
                copy_tree(item, DEST / item.name / "Lab Practicals", "rt")
        elif item.is_file():
            safe_copy(item, DEST / "Misc" / item.name, "rt")

# "Senior" — Senior notes organized by subject
src = SRC_RT / "Senior"
if src.exists():
    print("  👴 Senior Material...")
    for item in src.iterdir():
        if item.is_dir():
            sname = item.name.upper()
            if sname in ["CTCT", "CVML", "DCC", "EMB", "WLC"]:
                copy_tree(item, DEST / sname / "Senior Notes", "rt")
            elif sname == "IP":
                copy_tree(item, DEST / "Entrepreneurship & IP" / "Senior Notes", "rt")
            else:
                copy_tree(item, DEST / "Senior Material" / item.name, "rt")
        elif item.is_file():
            safe_copy(item, DEST / "Senior Material" / item.name, "rt")

# Journals (typo: "Jourbals")
src = SRC_RT / "Jourbals"
if src.exists():
    print("  📓 Journals (from rt)...")
    copy_tree(src, DEST / "Journals" / "Lab Journals (RT)", "rt")

# Placement
src = SRC_RT / "Placement"
if src.exists():
    print("  💼 Placement...")
    copy_tree(src, DEST / "Placement", "rt")

# IDE Bootcamp
src = SRC_RT / "IDE Bootcamp Material"
if src.exists():
    print("  🎓 IDE Bootcamp...")
    copy_tree(src, DEST / "Entrepreneurship & IP" / "IDE Bootcamp", "rt")

# Root files from Sem7.rt
print("  📄 Root files...")
for f in SRC_RT.iterdir():
    if not f.is_file():
        continue
    fl = f.name.lower()
    
    # Skip the 703MB zip
    if f.suffix.lower() == ".zip":
        print(f"    ⏭️  Skipping {f.name} (large zip, content already extracted)")
        continue
    
    if "sessionals-sem" in fl or "externals-sem" in fl:
        safe_copy(f, DEST / "Previous Year Papers" / f.name, "rt")
    elif "sip" in fl:
        safe_copy(f, DEST / "SIP" / f.name, "rt")
    elif "teaching plan" in fl or "teaching_plan" in fl:
        subject = detect_subject(f.name)
        if subject:
            safe_copy(f, DEST / subject / "Teaching Plan" / f.name, "rt")
        else:
            safe_copy(f, DEST / "Misc" / f.name, "rt")
    else:
        subject = detect_subject(f.name)
        if subject:
            safe_copy(f, DEST / subject / f.name, "rt")
        else:
            safe_copy(f, DEST / "Misc" / f.name, "rt")

p3 = copied - p1 - p2
print(f"  ✅ Phase 3: {p3} files\n")


# ============================================================
# Summary
# ============================================================
print("=" * 60)
print("✅ ORGANIZATION COMPLETE!")
print("=" * 60)
print(f"  📂 Output: {DEST}")
print(f"  📄 Total files copied: {copied}")
print(f"  🔄 Filename collisions resolved: {collisions}")
print(f"  📁 Original folders: UNTOUCHED")
print()

print("📂 Final structure:")
for item in sorted(DEST.iterdir()):
    if item.is_dir():
        file_count = sum(1 for _ in item.rglob("*") if _.is_file())
        print(f"  📁 {item.name}/ ({file_count} files)")
        for sub in sorted(item.iterdir()):
            if sub.is_dir():
                sub_count = sum(1 for _ in sub.rglob("*") if _.is_file())
                print(f"      📁 {sub.name}/ ({sub_count} files)")
            else:
                print(f"      📄 {sub.name}")
    else:
        print(f"  📄 {item.name}")
