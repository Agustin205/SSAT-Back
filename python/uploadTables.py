import csv
import mysql.connector
from datetime import datetime
import os
import json
import sys

#Funcion que borra archios de una carpeta
def borrar_archivos_en_carpeta(carpeta):
    try:
        # Obtener la lista de archivos en la carpeta
        archivos = os.listdir(carpeta)

        # Eliminar cada archivo en la carpeta
        for archivo in archivos:
            ruta_completa = os.path.join(carpeta, archivo)
            os.remove(ruta_completa)
            print(f"Archivo {archivo} eliminado con éxito.")

        print("Todos los archivos han sido eliminados de la carpeta.")
    except Exception as e:
        print("Error al eliminar archivos:", str(e))

#Obtiene la fecha de hoy
now = datetime.now()
formatted_date = now.strftime('%Y-%m-%d %H:%M:%S')

#Colocamos rutas abosluta (cuando ejecutamos un subproceso la carpeta central no esta)
current_directory = os.path.dirname(os.path.abspath(__file__))

#Abrimos archivo config:Tenemos info de las tablas y runconfig:Tenemos info de los clientes
with open(os.path.join(current_directory,'config.json'), 'r') as config_file:
    config = json.load(config_file)

with open(os.path.join(current_directory,'runconfig.json'), 'r') as runconfig_file:
    runconfig = json.load(runconfig_file)

connectionMysql = mysql.connector.connect(user='root', password='Agustin123', host='localhost', database='ssat')
cursor = connectionMysql.cursor() #Nos permite hacer consultas.
tableData = config['tables'] #Obtenemos el arrayTablas = [{tab1:{},tab2:{}....}]
folder = os.path.join(os.getcwd(),'public/TABLAS_SAP/')
for file_name in os.listdir(folder):
    table = next((t for t in tableData if t['file_name'] == file_name.lower()), None)
    if table is not None:
        if file_name == "usr11.txt" or file_name == "usr13.txt":
            with open(folder + file_name, encoding="MacRoman") as csvfile: #Como existe lo abro como un csv
                reader = csv.reader(csvfile, delimiter='|') #Reader es un lector de filas que separa cada columna por |
                for i in range(5):
                    next(reader) #Salteo los primeros 5 filas
                for row in reader: 
                    try:
                        newRow = row[2:-1]
                        newRowA = row[2:-1]
                        newRow = list(map(str.strip, newRowA))
                        newRowV2 = newRow + [sys.argv[1],formatted_date] #Agarro las columnas que me sirven y le sumo cliente y fecha (es un array)
                        table_name = table['name']
                        qty = table['qty']
                        placeholder = ', '.join(['%s'] * qty) #Hago un string con %s,%s... x cada columna 
                        query = f'INSERT INTO {table_name} ({table["columns"]}) VALUES ({placeholder})' #Genero la sintaxis del insert
                        data = tuple(newRowV2)
                        cursor.execute(query,data) #Ejecuto la consulto, pasamos el insert y dsp los datos (en secuencial)
                    except Exception as e:
                        print(f"Error insertando datos en la tabla {table_name} con los datos: {data}")
                connectionMysql.commit() #Finalmente hacemos un commit de las consultas para así se ejecuten las consultas en la BD x archivo.
        else:
            with open(folder + file_name, encoding="iso-8859-1") as csvfile: #Como existe lo abro como un csv
                reader = csv.reader(csvfile, delimiter='|') #Reader es un lector de filas que separa cada columna por |
                for i in range(5):
                    next(reader) #Salteo los primeros 5 filas
                for row in reader: 
                    try:
                        newRow = row[2:-1]
                        newRowA = row[2:-1]
                        newRow = list(map(str.strip, newRowA))
                        newRowV2 = newRow + [sys.argv[1],formatted_date] #Agarro las columnas que me sirven y le sumo cliente y fecha (es un array)
                        table_name = table['name']
                        qty = table['qty']
                        placeholder = ', '.join(['%s'] * qty) #Hago un string con %s,%s... x cada columna 
                        query = f'INSERT INTO {table_name} ({table["columns"]}) VALUES ({placeholder})' #Genero la sintaxis del insert
                        data = tuple(newRowV2)
                        cursor.execute(query,data) #Ejecuto la consulto, pasamos el insert y dsp los datos (en secuencial)
                    except Exception as e:
                        print(f"Error insertando datos en la tabla {table_name} con los datos: {data}")
                connectionMysql.commit() #Finalmente hacemos un commit de las consultas para así se ejecuten las consultas en la BD x archivo.

borrar_archivos_en_carpeta(folder)    
cursor.close()
connectionMysql.close() 