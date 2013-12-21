#!/usr/bin/env python
# encoding: utf-8

'''
This script will fetch calendar data from the official Interpreti Veneziani
website and output it as a list of date items in JSON for later use.
'''

import datetime
import json
from lxml import etree
import sys
import time

def stderr(message):
    sys.stderr.write('%s\n' % message)

START_URL = 'http://www.interpretiveneziani.com/en/stagione-concertistica.php'
MONTHS = range(1, 13)
DEFAULT_TIME_HOURS = 20
DEFAULT_TIME_MINUTE = 30

parser = etree.HTMLParser()
html = etree.parse(START_URL, parser)

root_element = html.getroot()

if not (etree.iselement(root_element) and len(root_element)):
    stderr('Found no root element, something is wrong.')
    sys.exit(1)

years = [int(y) for y in html.xpath('//select[@name="anno"]/option/text()')]

if not years:
    stderr('Could not find any years, something is wrong.')
    sys.exit(1)

concerts = []

for year in years:
    for month in MONTHS:
        sys.stderr.write('Parsing concerts for %s %s...' % (datetime.datetime(year=year, month=month, day=1).strftime('%B'), year))
        url = 'http://www.interpretiveneziani.com/en/get_calendario.php?mese=%s&anno=%s' % (month, year)
        html = etree.parse(url, parser)
        links = html.xpath('//div[@class="av-vento"]/a[@href]')
        stderr(' found %i concerts' % len(links))
        for link in links:
            day = int(link.text)
            date = datetime.datetime(year=year, month=month, day=day, hour=DEFAULT_TIME_HOURS, minute=DEFAULT_TIME_MINUTE)
            concerts.append((date, link.get('href')))
        time.sleep(1)

stderr('Found a total of %i concerts:\n%s' % (len(concerts), concerts))

print json.dumps([(date.isoformat(), href) for date, href in concerts], indent=4)
