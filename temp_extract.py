import zipfile, re
from pathlib import Path
p = Path(r'assets/newsroom assets/The Netflix Effect for AI Why Families Will Soon Share a Homewide Intelligence System/The Netflix Effect for AI_ Why Families Will Soon Share a Homewide Intelligence System.docx')
with zipfile.ZipFile(p) as z:
    xml = z.read('word/document.xml').decode('utf-8')
text = re.sub('<[^>]+>', ' ', xml)
text = re.sub(r'\s+', ' ', text)
print(text[:4000])
