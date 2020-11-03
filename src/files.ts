import * as fs from 'fs'

export const getFile = (fichero : string) => {
    let data = fs.readFileSync(fichero, 'utf8');
   
    if (!data) return [];
    else {
      const file = JSON.parse(data);
      return file;
    }
  }
   
export const setFile = (fichero : string, datos : object) => {
        return fs.writeFileSync(fichero, JSON.stringify(datos));
  }
   