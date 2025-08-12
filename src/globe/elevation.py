# script to process globe elevation data into json
import rasterio
import json
import numpy as np

EXTRACTED_TIF = '../../../../Downloads/ETOPO1_Bed_g_geotiff/ETOPO1_Bed_g_geotiff.tif'

def elevation_to_globejson(elevation_tif_path, output_json_path, sample_step=100, size_scale=0.0002):
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
    elevation_to_globejson(EXTRACTED_TIF, './src/globe/globe_elevation.json')

if __name__ == '__main__':
    main()
