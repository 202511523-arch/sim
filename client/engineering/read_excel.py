import pandas as pd
import glob
import os

def process_excel():
    files = glob.glob('c:/Users/sgko1/Desktop/doodle/simvex/client/engineering/3D Asset/*.xlsx')
    if not files:
        print("No Excel files found.")
        return
    
    # Sort by modification time to get the latest one
    files.sort(key=os.path.getmtime, reverse=True)
    f = files[0]
    print(f"Processing: {f}")
    
    try:
        df_dict = pd.read_excel(f, sheet_name=None)
        output = 'c:/Users/sgko1/Desktop/doodle/simvex/client/engineering/excel_data.txt'
        with open(output, 'w', encoding='utf-8') as out:
            for sheet_name, df in df_dict.items():
                out.write(f"Sheet: {sheet_name}\n")
                out.write(df.to_string())
                out.write("\n\n")
        print(f"Successfully wrote to {output}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    process_excel()
