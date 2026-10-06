import os
import glob

directory = r"c:\Users\softs\Desktop\UOK Website\uok-stadum"
html_files = glob.glob(os.path.join(directory, "*.html"))

search_text = """              <div class="footer-info">
                <a href="contact.html"><span class="footer-info-icon"><i class="fa-solid fa-location-dot"></i></span> University Road, Karachi-75270</a>
                <a href="mailto:registrar@uok.edu.pk"><span class="footer-info-icon"><i class="fa-solid fa-envelope"></i></span> registrar@uok.edu.pk</a>
              </div>"""

replace_text = """              <div class="footer-info">
                <a href="contact.html"><span class="footer-info-icon"><i class="fa-solid fa-location-dot"></i></span> University Road, Karachi-75270</a>
                <a href="mailto:registrar@uok.edu.pk"><span class="footer-info-icon"><i class="fa-solid fa-envelope"></i></span> registrar@uok.edu.pk</a>
              </div>
              <div class="th-social mt-4">
                <a href="https://www.facebook.com/uoktimes/"><i class="fab fa-facebook-f"></i></a>
                <a href="https://www.linkedin.com/company/kutimes/"><i class="fab fa-linkedin-in"></i></a>
                <a href="https://www.youtube.com/KUTIMES"><i class="fab fa-youtube"></i></a>
                <a href="https://www.instagram.com/kutimes1951/"><i class="fab fa-instagram"></i></a>
                <a href="https://x.com/intent/tweet?ref_src=twsrc%5Etfw%7Ctwcamp%5Ebuttonembed%7Ctwterm%5Eshare%7Ctwgr%5E&text=University%20of%20Karachi%20%3A%20Welcome&url=https%3A%2F%2Fuok.edu.pk%2F&via=infouok"><i class="fab fa-twitter"></i></a>
                <a href="https://whatsapp.com/channel/0029Vap9QMDAO7RIzFDvuu2B"><i class="fab fa-whatsapp"></i></a>
              </div>"""

for file_path in html_files:
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if search_text in content:
        content = content.replace(search_text, replace_text)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {os.path.basename(file_path)}")
    else:
        print(f"Skipped {os.path.basename(file_path)} - Footer info not found")
