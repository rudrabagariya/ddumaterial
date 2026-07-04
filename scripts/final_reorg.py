import os
import shutil
from pathlib import Path

DEST = Path('/media/rudra/New Volume/DDU material/sem-7')

# Create new root folders
notes_dir = DEST / 'notes'
pyqs_dir = DEST / 'pyqs'
lab_manuals_dir = DEST / 'lab manuals'
teaching_plan_dir = DEST / 'teaching plan'
textbooks_dir = DEST / 'textbooks'
assignments_dir = DEST / 'assignments'
iamnotgetting_dir = DEST / 'iamnotgetting'

for d in [notes_dir, pyqs_dir, lab_manuals_dir, teaching_plan_dir, textbooks_dir, assignments_dir, iamnotgetting_dir]:
    d.mkdir(exist_ok=True)

# First, handle the existing Sessional 1, 2, 3 folders that I made earlier.
# They are currently: sem-7/Sessional 1/CVML/Notes/...
sessional_folders = ['Sessional 1', 'Sessional 2', 'Sessional 3']
for sess in sessional_folders:
    src_sess = DEST / sess
    if src_sess.exists():
        # Move it inside notes/
        target_sess = notes_dir / sess.lower()
        target_sess.mkdir(exist_ok=True)
        for subject_dir in src_sess.iterdir():
            if subject_dir.is_dir():
                target_subj = target_sess / subject_dir.name
                target_subj.mkdir(exist_ok=True)
                for item in subject_dir.iterdir():
                    if item.is_dir() and item.name == 'Notes':
                        for f in item.rglob('*'):
                            if f.is_file():
                                rel = f.relative_to(item)
                                target_file = target_subj / rel
                                target_file.parent.mkdir(parents=True, exist_ok=True)
                                if not target_file.exists():
                                    shutil.move(str(f), str(target_file))
                    elif item.is_file():
                        shutil.move(str(item), str(target_subj / item.name))
        shutil.rmtree(str(src_sess), ignore_errors=True)

# Now iterate over the 5 original subject folders
subjects = ['CTCT', 'CVML', 'DCC', 'EMB', 'WLC']

for subject in subjects:
    subj_dir = DEST / subject
    if not subj_dir.exists():
        continue
        
    for item in list(subj_dir.iterdir()):
        if not item.is_dir():
            # Loose files in subject folder
            target = iamnotgetting_dir / subject / item.name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(item), str(target))
            continue
            
        iname = item.name
        
        # PYQs
        if iname == 'EXTERNAL' or iname == 'PYQ' or iname == 'External Exam Notes':
            target_dir = pyqs_dir / subject
            target_dir.mkdir(parents=True, exist_ok=True)
            for f in item.rglob('*'):
                if f.is_file():
                    shutil.move(str(f), str(target_dir / f.name))
                    
        # Lab Manuals
        elif iname in ['LAB MANUAL', 'Lab Practicals', 'Practicals', 'Lab Code', 'Lab Files']:
            target_dir = lab_manuals_dir / subject / iname
            target_dir.mkdir(parents=True, exist_ok=True)
            for f in item.rglob('*'):
                if f.is_file():
                    rel = f.relative_to(item)
                    target_file = target_dir / rel
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), str(target_file))
                    
        # Teaching Plan
        elif iname == 'TEACHING PLAN':
            target_dir = teaching_plan_dir / subject
            target_dir.mkdir(parents=True, exist_ok=True)
            for f in item.rglob('*'):
                if f.is_file():
                    shutil.move(str(f), str(target_dir / f.name))
                    
        # Textbooks
        elif iname == 'TEXTBOOK':
            target_dir = textbooks_dir / subject
            target_dir.mkdir(parents=True, exist_ok=True)
            for f in item.rglob('*'):
                if f.is_file():
                    rel = f.relative_to(item)
                    target_file = target_dir / rel
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), str(target_file))
                    
        # Assignments
        elif iname == 'Assignments':
            target_dir = assignments_dir / subject
            target_dir.mkdir(parents=True, exist_ok=True)
            for f in item.rglob('*'):
                if f.is_file():
                    rel = f.relative_to(item)
                    target_file = target_dir / rel
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), str(target_file))
                    
        # Remaining stuff (Notes, Senior, Classroom Materials, etc) -> iamnotgetting
        else:
            target_dir = iamnotgetting_dir / subject / iname
            target_dir.mkdir(parents=True, exist_ok=True)
            for f in item.rglob('*'):
                if f.is_file():
                    rel = f.relative_to(item)
                    target_file = target_dir / rel
                    target_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(f), str(target_file))
                    
    # Delete the empty subject folder
    shutil.rmtree(str(subj_dir), ignore_errors=True)

# Also move Previous Year Papers from root to pyqs
prev_yr = DEST / 'Previous Year Papers'
if prev_yr.exists():
    for f in prev_yr.rglob('*'):
        if f.is_file():
            # Try to guess subject from filename
            fl = f.name.lower()
            subj = None
            if 'ctct' in fl or 'sst' in fl or 'vmt' in fl: subj = 'CTCT'
            elif 'cvml' in fl or 'spt' in fl or 'ykm' in fl: subj = 'CVML'
            elif 'dcc' in fl: subj = 'DCC'
            elif 'emb' in fl: subj = 'EMB'
            elif 'wlc' in fl or 'rappaport' in fl: subj = 'WLC'
            else: subj = 'Misc'
            
            target = pyqs_dir / subj / f.name
            target.parent.mkdir(parents=True, exist_ok=True)
            if not target.exists():
                shutil.move(str(f), str(target))
    shutil.rmtree(str(prev_yr), ignore_errors=True)

print("Reorganization complete!")
