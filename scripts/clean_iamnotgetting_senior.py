import os
import shutil
from pathlib import Path

DEST = Path('/media/rudra/New Volume/DDU material/sem-7')
iam = DEST / 'iamnotgetting'

moved = 0
skipped = 0

def move_file(f, target_dir):
    global moved, skipped
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f.name
    if not target.exists():
        shutil.move(str(f), str(target))
        moved += 1
    elif target.stat().st_size == f.stat().st_size:
        skipped += 1
    else:
        new_name = f'{target.stem} [moved_senior]{target.suffix}'
        shutil.move(str(f), str(target.parent / new_name))
        moved += 1

for f in iam.rglob('*'):
    if not f.is_file():
        continue
        
    fl = f.name.lower()
    parent_path = str(f.relative_to(iam)).lower()
    combined = f"{parent_path} {fl}"
    
    # Determine Subject
    subject = None
    if 'ctct' in combined: subject = 'CTCT'
    elif 'cvml' in combined: subject = 'CVML'
    elif 'dcc' in combined: subject = 'DCC'
    elif 'emb' in combined: subject = 'EMB'
    elif 'wlc' in combined: subject = 'WLC'
    else: continue
    
    # 1. Textbooks
    if any(x in combined for x in ['tb_', 't1_', 'textbook', 'solution_tb', 'rappaport']):
        move_file(f, DEST / 'textbooks' / subject)
        
    # 2. Teaching Plan / Syllabus
    elif any(x in combined for x in ['teaching', 'syllabus', 'syallbus']):
        move_file(f, DEST / 'teaching plan' / subject)
        
    # 3. Assignments
    elif any(x in combined for x in ['assignment', 'assignemnt', 'assignemtn']):
        move_file(f, DEST / 'assignments' / subject)
        
    # 4. PYQs / Exam solutions
    elif any(x in combined for x in ['pyq', 'prev year', 'solution', 'soln', 'sol.pdf']):
        move_file(f, DEST / 'pyqs' / subject)
        
    # 5. Sessional specific notes
    elif any(x in combined for x in ['phase1', 'phase 1', 'p1', '1st', 'first']):
        move_file(f, DEST / 'notes' / 'sessional 1' / subject)
        
    elif any(x in combined for x in ['phase2', 'phase 2', 'p2', '2nd', 'second']):
        move_file(f, DEST / 'notes' / 'sessional 2' / subject)
        
    elif any(x in combined for x in ['phase3', 'phase 3', 'p3', '3rd', 'third']):
        move_file(f, DEST / 'notes' / 'sessional 3' / subject)
        
    # 7. Remaining Senior Notes (put into General/Senior Notes)
    else:
        if 'classroom' in combined or '.ppt' in fl or '.zip' in fl:
            move_file(f, DEST / 'notes' / 'General' / subject / 'Classroom Materials')
        else:
            move_file(f, DEST / 'notes' / 'General' / subject / 'Senior Notes')

print(f"Automagically moved {moved} remaining senior files!")
print(f"Skipped {skipped} duplicates.")
