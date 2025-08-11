import os
import requests
import rasterio
import json
import numpy as np
import zipfile

ETOPO1_URL = 'https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO1/data/bedrock/grid_registered/georeferenced_tiff/ETOPO1_Bed_g_geotiff.zip'
ZIP_FILE = 'ETOPO1_Bed_g_geotiff.zip'
EXTRACTED_TIF = 'ETOPO1_Bed_g_geotiff/ETOPO1_Bed_g.tif'  # inside the zip

with open('ETOPO1_Bed_g_geotiff.zip', 'rb') as f:
    print(f.read(4))


def download_etopo1():
    if os.path.exists(EXTRACTED_TIF):
        print('Elevation file already downloaded and extracted.')
        return
    print('Downloading ETOPO1 GeoTIFF...')
    r = requests.get(ETOPO1_URL, stream=True)
    with open(ZIP_FILE, 'wb') as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print('Download complete.')
    
    with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
        zip_ref.extractall()
    print('Extraction complete.')
    os.remove(ZIP_FILE)

def elevation_to_globejson(elevation_tif_path, output_json_path, sample_step=100, size_scale=0.005):
    with rasterio.open(elevation_tif_path) as src:
        elevation = src.read(1)
        transform = src.transform
        rows, cols = elevation.shape
        data = []
        for row in range(0, rows, sample_step):
            for col in range(0, cols, sample_step):
                elev_value = elevation[row, col]
                if elev_value < 0 or np.isnan(elev_value):
                    continue
                lon, lat = rasterio.transform.xy(transform, row, col)
                size = elev_value * size_scale
                if size < 0.01:
                    size = 0.01
                data.extend([lat, lon, size])
    with open(output_json_path, 'w') as f:
        json.dump(data, f)
    print(f'Saved {len(data)//3} points to {output_json_path}')

def main():
    download_etopo1()
    elevation_to_globejson(EXTRACTED_TIF, 'globe_elevation.json')

if __name__ == '__main__':
    main()
