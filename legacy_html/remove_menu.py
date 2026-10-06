import os
import glob
import re

dir_path = r'c:\Users\softs\Desktop\UOK Website\uok-stadum'
html_files = glob.glob(os.path.join(dir_path, '*.html'))

changed_files = 0
for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    def replacer(match):
        header_content = match.group(0)
        # Remove News and Library <li> items
        header_content = re.sub(r'\s*<li><a href="news\.html">News</a></li>', '', header_content, flags=re.IGNORECASE)
        header_content = re.sub(r'\s*<li><a href="library\.html\">Library</a></li>', '', header_content, flags=re.IGNORECASE)
        return header_content
        
    new_content = re.sub(r'<div class="th-menu-wrapper">.*?</header>', replacer, content, flags=re.DOTALL | re.IGNORECASE)
    
    # Also handle _chrome-header.html which might not have <div class="th-menu-wrapper">
    if 'th-menu-wrapper' not in content:
        # Just remove globally but carefully
        new_content = re.sub(r'\s*<li><a href="news\.html">News</a></li>', '', new_content, flags=re.IGNORECASE)
        new_content = re.sub(r'\s*<li><a href="library\.html\">Library</a></li>', '', new_content, flags=re.IGNORECASE)

    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        changed_files += 1

print(f'Modified {changed_files} files.')
