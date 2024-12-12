import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  imgKey:string="base64Img";
  mapKey:string="mapData";
  constructor() { }
  

  storeImage(file: File) { //: Promise<void>
    // return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64Image = reader.result as string;
        // try {
          localStorage.setItem(this.imgKey, base64Image);
          // console.log(`Image stored successfully under key: ${key}`);
          // resolve();
        // } catch (error) {
          // console.error('Error storing image:', error);
          // reject(error);
        // }
      };

      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        // reject(error);
      };

      reader.readAsDataURL(file); // Convert image file to Base64
    // });
  }
  // onMapEdit,isMapInEdit,deleteMapEdit need to revised and later can be removed
  onMapEdit(){
    localStorage.setItem("isMapInEdit", JSON.stringify(true));
  }

  storeMapDetails(mapDet:any){
    localStorage.setItem(this.mapKey, JSON.stringify(mapDet));
  }

  getImage(): string | null {
    try {
      return localStorage.getItem(this.imgKey);
    } catch (error) {
      // console.error('Error retrieving image:', error);
      return null;
    }
  }

  isMapInEdit():boolean{
    let onMapEdit=localStorage.getItem("isMapInEdit");
    return onMapEdit ? JSON.parse(onMapEdit) : null;
  }
  getMapDetails():any{
    let mapData=localStorage.getItem(this.mapKey);
    return mapData ? JSON.parse(mapData) : null;
  }

  deleteImage(): void {
    try {
      localStorage.removeItem(this.imgKey);
      console.log(`Image deleted successfully for key: ${this.imgKey}`);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
  deleteMapEdit(){
    localStorage.removeItem("isMapInEdit");
  }
  delMapDetails(){
    localStorage.removeItem(this.mapKey);
  }
  base64toFile(): File | null {
    try {
      const base64Data = localStorage.getItem(this.imgKey);
      if (!base64Data) return null;

      // Extract Base64 string and convert it to a Blob
      const base64Content = base64Data.split(',')[1]; // Extract only the Base64 content
      const mimeType = base64Data.match(/data:(.*?);base64/)?.[1] || 'application/octet-stream';
      const binaryData = atob(base64Content); // Decode Base64 string to binary
      const byteArray = new Uint8Array(binaryData.length);

      for (let i = 0; i < binaryData.length; i++) {
        byteArray[i] = binaryData.charCodeAt(i);
      }

      const blob = new Blob([byteArray], { type: mimeType });

      // Create a File object
      const file = new File([blob], 'retrievedImage', { type: mimeType });
      return file;
    } catch (error) {
      console.error('Error retrieving image:', error);
      return null;
    }
  }
  grossDelete(){
    localStorage.removeItem(this.imgKey);
    localStorage.removeItem("isMapInEdit");
    localStorage.removeItem(this.mapKey);
    // localStorage.clear();
  }
}
