import os
import shutil
from pathlib import Path

DEST = Path('/media/rudra/New Volume/DDU material/sem-7')
journals_dir = DEST / 'Journals'
lab_manuals_dir = DEST / 'lab manuals'

moved = 0
skipped = 0

if journals_dir.exists():
    for f in journals_dir.rglob('*'):
        if f.is_file():
            fl = f.name.lower()
            subject = None
            
            # Check parent folder names for subject
            parents = [p.lower() for p in f.relative_to(journals_dir).parts]
            if 'cvml' in parents:
                subject = 'CVML'
            elif 'dcc' in parents:
                subject = 'DCC'
            elif 'emb' in parents:
                subject = 'EMB'
            
            # Fallback to filename
            if not subject:
                if 'cvml' in fl or 'spt' in fl or 'ykm' in fl:
                    subject = 'CVML'
                elif 'dcc' in fl:
                    subject = 'DCC'
                elif 'emb' in fl:
                    subject = 'EMB'
                else:
                    subject = 'Misc'
            
            target_dir = lab_manuals_dir / subject / 'Journals'
            target_dir.mkdir(parents=True, exist_ok=True)
            target = target_dir / f.name
            
            if not target.exists():
                shutil.move(str(f), str(target))
                moved += 1
            elif target.stat().st_size == f.stat().st_size:
                skipped += 1
            else:
                new_name = f'{target.stem} [journal]{target.suffix}'
                shutil.move(str(f), str(target.parent / new_name))
                moved += 1

    shutil.rmtree(str(journals_dir), ignore_errors=True)

print(f"Moved {moved} journal files into lab manuals.")
print(f"Skipped {skipped} duplicates.")
