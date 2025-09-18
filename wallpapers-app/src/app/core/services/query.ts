import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, 
updateDoc, deleteDoc, query, where, getDocs, orderBy, 
limit, WhereFilterOp, addDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class Query {

  constructor(private firestore: Firestore) { }

  // Verificar estado de conexión
  private async checkConnection(): Promise<void> {
    if (!navigator.onLine) {
      throw new Error('Sin conexión a internet. Verifica tu conexión y vuelve a intentar.');
    }
    
    // Verificar si Firestore está disponible haciendo una operación simple
    try {
      const testRef = doc(this.firestore, 'test', 'connection');
      await getDoc(testRef);
    } catch (error: any) {
      if (this.isConnectivityError(error)) {
        throw new Error('No se puede conectar con la base de datos. Verifica tu conexión e intenta nuevamente.');
      }
    }
  }

  // Verificar si el error es de conectividad
  private isConnectivityError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';
    
    return errorMessage.includes('network') || 
          errorMessage.includes('offline') || 
          errorMessage.includes('connection') ||
          errorCode.includes('unavailable') ||
          errorCode.includes('deadline-exceeded');
  }

  // Mecanismo de reintentos para operaciones de Firestore
  private async retryOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        console.warn(`Intento ${attempt}/${maxRetries} falló:`, error);
        
        if (!this.isConnectivityError(error) || attempt === maxRetries) {
          throw error;
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError;
  }

  // Crear documento
  async createDocument(collectionName: string, docId: string, data: any): Promise<void> {
    await this.checkConnection();
    return this.retryOperation(async () => {
      const docRef = doc(this.firestore, collectionName, docId);
      await setDoc(docRef, data);
      console.log(`Documento creado exitosamente: ${collectionName}/${docId}`);
    });
  }

  // Crear documento con ID automático
  async createDocumentWithAutoId(collectionName: string, data: any): Promise<string> {
    await this.checkConnection();
    return this.retryOperation(async () => {
      const collectionRef = collection(this.firestore, collectionName);
      const docRef = await addDoc(collectionRef, data);
      console.log(`Documento creado exitosamente con ID automático: ${collectionName}/${docRef.id}`);
      return docRef.id;
    });
  }

  // Obtener documento por ID
  async getDocument(collectionName: string, docId: string): Promise<any> {
    await this.checkConnection();
    return this.retryOperation(async () => {
      const docRef = doc(this.firestore, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log(`Documento obtenido exitosamente: ${collectionName}/${docId}`);
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        console.log(`Documento no encontrado: ${collectionName}/${docId}`);
        return null;
      }
    });
  }

  // Actualizar documento
  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    await this.checkConnection();
    return this.retryOperation(async () => {
      const docRef = doc(this.firestore, collectionName, docId);
      await updateDoc(docRef, data);
      console.log(`Documento actualizado exitosamente: ${collectionName}/${docId}`);
    });
  }

  // Eliminar documento
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    await this.checkConnection();
    return this.retryOperation(async () => {
      const docRef = doc(this.firestore, collectionName, docId);
      await deleteDoc(docRef);
      console.log(`Documento eliminado exitosamente: ${collectionName}/${docId}`);
    });
  }

  // Consultar documentos con filtros (versión simple - mantener compatibilidad)
  async queryDocuments(
    collectionName: string, 
    conditions: Array<{field: string, operator: WhereFilterOp, value: any}> | string,
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
    limitCount?: number
  ): Promise<any[]> {
    await this.checkConnection();
    return this.retryOperation(async () => {
      const collectionRef = collection(this.firestore, collectionName);
      let queryConstraints: any[] = [];

      // Manejar tanto la interfaz antigua como la nueva
      if (typeof conditions === 'string') {
        // Interfaz antigua: queryDocuments(collection, field, operator, value)
        const field = conditions;
        const operator = orderByField as WhereFilterOp;
        const value = orderDirection;
        queryConstraints.push(where(field, operator, value));
      } else {
        // Nueva interfaz: queryDocuments(collection, conditions[], orderBy, direction, limit)
        conditions.forEach(condition => {
          queryConstraints.push(where(condition.field, condition.operator, condition.value));
        });

        if (orderByField) {
          queryConstraints.push(orderBy(orderByField, orderDirection || 'desc'));
        }

        if (limitCount) {
          queryConstraints.push(limit(limitCount));
        }
      }

      const q = query(collectionRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`Consulta ejecutada exitosamente: ${collectionName} (${documents.length} documentos)`);
      return documents;
    });
  }
}
