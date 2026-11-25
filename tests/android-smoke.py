"""Exercise packaged Android content and the native document/hash bridge via adb."""
import subprocess
import time
import re
from pathlib import Path
import xml.etree.ElementTree as ET

PACKAGE='com.beaconoftheeagle.centinellia'
OUT=Path('test-results/android'); OUT.mkdir(parents=True,exist_ok=True)
def adb(*args):
    return subprocess.check_output(['adb',*args],stderr=subprocess.STDOUT)
def tree():
    adb('shell','uiautomator','dump','/sdcard/window.xml')
    xml=adb('shell','cat','/sdcard/window.xml').decode()
    (OUT/'last-window.xml').write_text(xml)
    return ET.fromstring(xml)
def find(label, timeout=40):
    end=time.time()+timeout
    while time.time()<end:
        nodes=list(tree().iter('node'))
        nodes.sort(key=lambda node:0 if node.get('text','').lower()==label.lower() else 1)
        for node in nodes:
            if label.lower() in (node.get('text','')+' '+node.get('content-desc','')).lower():
                bounds=list(map(int,re.findall(r'\d+',node.get('bounds',''))))
                if len(bounds)==4 and bounds[2]>bounds[0] and bounds[3]>bounds[1]:
                    return node
        time.sleep(1)
    raise AssertionError('Android UI did not show: '+label)
def tap(label):
    node=find(label);x1,y1,x2,y2=map(int,re.findall(r'\d+',node.get('bounds')))
    adb('shell','input','tap',str((x1+x2)//2),str((y1+y2)//2))
def screenshot(name):
    (OUT/name).write_bytes(adb('exec-out','screencap','-p'))
try:
    apk=next(Path('android-build').rglob('app-debug.apk'))
    adb('install','-r',str(apk))
    adb('shell','am','start','-W','-n',PACKAGE+'/.MainActivity')
    tap('Enter Security Operations Center')
    find('Security operations center');screenshot('android-overview.png')
    tap('Tools');tap('SHA-256 hashing')
    fixture=OUT/'centinellia-fixture.txt';fixture.write_bytes(b'abc')
    adb('push',str(fixture),'/sdcard/Download/centinellia-fixture.txt')
    tap('Choose a file')
    # The system document picker is outside the app. Choose only our test fixture.
    try: tap('Show roots')
    except AssertionError: pass
    tap('Downloads')
    # Use list layout so tapping a full filename selects the document, rather
    # than a thumbnail's separate preview action in the grid layout.
    try: tap('List view')
    except AssertionError: pass
    screenshot('android-document-picker.png')
    tap('centinellia-fixture.txt')
    # Results can be below the fold on smaller Android viewports.
    for _ in range(2):
        adb('shell','input','swipe','500','1700','500','700','350')
        time.sleep(1)
    find('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
    screenshot('android-file-hash.png')
    adb('shell','am','force-stop',PACKAGE)
    adb('shell','am','start','-W','-n',PACKAGE+'/.MainActivity')
    tap('Enter Security Operations Center')
    find('Security operations center')
    log=adb('logcat','-d','-s','AndroidRuntime:E').decode()
    assert 'FATAL EXCEPTION' not in log,log
    print('ANDROID PASS: install, offline packaged UI, native file picker, SHA-256 known vector, restart.')
finally:
    screenshot('android-final.png')
    (OUT/'runtime.log').write_bytes(adb('logcat','-d','-s','AndroidRuntime:E','chromium:E'))
