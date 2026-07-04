import os
import shutil
from pathlib import Path

DEST = Path('/media/rudra/New Volume/DDU material/sem-7')

sessional_map = {
    'FIRST SESSIONAL': 'Sessional 1',
    'SECOND SESSIONAL': 'Sessional 2',
    'THIRD SESSIONAL': 'Sessional 3'
}

moved = 0
for subject in ['CTCT', 'CVML', 'DCC', 'EMB', 'WLC']:
    sd = DEST / subject
    if not sd.exists():
        continue
        
    for old_sess, new_sess in sessional_map.items():
        src = sd / old_sess
        if src.exists():
            target_dir = DEST / new_sess / subject
            target_dir.mkdir(parents=True, exist_ok=True)
            
            # The user specifically wants a 'Notes' folder inside Sessional X / Subject
            notes_dir = target_dir / 'Notes'
            notes_dir.mkdir(exist_ok=True)
            
            for item in src.iterdir():
                if item.is_file():
                    shutil.move(str(item), str(notes_dir / item.name))
                    moved += 1
                elif item.is_dir():
                    # Move contents of the directory into Notes as well (like 'Notes (Phase 1 Notes)')
                    for sub_item in item.rglob('*'):
                        if sub_item.is_file():
                            shutil.move(str(sub_item), str(notes_dir / sub_item.name))
                            moved += 1
            
            # Remove old sessional folder
            shutil.rmtree(str(src), ignore_errors=True)

print(f"Moved {moved} files into new Sessional structure.")
