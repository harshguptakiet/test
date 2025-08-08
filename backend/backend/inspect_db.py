#!/usr/bin/env python3
import sqlite3
import json

def inspect_database():
    conn = sqlite3.connect('curagenie_real.db')
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print("📋 Database Tables:", [t[0] for t in tables])
    
    for table_name in [t[0] for t in tables]:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"📊 {table_name}: {count} records")
        
        if table_name == 'uploaded_files' and count > 0:
            cursor.execute("SELECT filename, file_type, processing_status FROM uploaded_files LIMIT 3")
            files = cursor.fetchall()
            print("   Recent files:")
            for f in files:
                print(f"     - {f[0]} ({f[1]}) - {f[2]}")
                
        if table_name == 'genomic_variants' and count > 0:
            cursor.execute("SELECT chromosome, position, reference, alternative FROM genomic_variants LIMIT 3")
            variants = cursor.fetchall()
            print("   Sample variants:")
            for v in variants:
                print(f"     - {v[0]}:{v[1]} {v[2]}>{v[3]}")
    
    conn.close()

if __name__ == "__main__":
    inspect_database()
