import lancedb
from pypdf import PdfReader
import os
from google import genai
from google.genai import types
from app.core.config import STORAGE_PATH, VDB_DEST

class VDBManager():
    def __init__(self, llmclient, destination: str=VDB_DEST):
         # Initialize / Open Vector Database
        self.vdb = lancedb.connect(VDB_DEST)
        self.llmclient = llmclient

        # Vector DB Tables
        # 1. User Preferences Table
        try:
            self.pref_table = self.vdb.create_table(
                "user_preferences",
                data=[{"vector": [0.0] * 768, "text": "", "category": ""}],
                mode="overwrite"
            )
        except Exception as e:
            print(e)
            self.pref_table = self.vdb.open_table("user_preferences")

        # 2. Knowledge Base Table
        try:
            self.kb_table = self.vdb.create_table(
                "knowledge_base",
                data=[{"vector": [0.0] * 768, "file_path": "", "file_type": "", "description": ""}],
                mode="overwrite"
            )
        except:
            self.kb_table = self.vdb.open_table("knowledge_base")
    

    def embed(self, filepath: str=None, content: bytearray | str=None):
        """
        Receives file or text.
        Returns vector embedding of input using embedding-004 for multimodal vector embedding
        """
        print(f'[VDB-DBG] Received file: {filepath}')
        image_types = (".jpg", ".png", ".jpeg")
        if filepath:
            if os.path.exists(filepath) and filepath.lower().endswith('.pdf'):
                # File is PDF, read pdf using PdfReader
                reader = PdfReader(filepath)
                text_content = ""
                for page in reader.pages:
                    text_content += page.extract_text() + "\n"
                
                # Embed file content
                response = self.llmclient.models.embed_content(
                    model='gemini-embedding-001',
                    contents=text_content[:9000],
                    config=types.EmbedContentConfig(output_dimensionality=768)
                )
            
            elif os.path.exists(filepath) and filepath.lower().endswith(image_types):
                print(f'Detected file: {filepath} as image')
                # File is an image
                upload_file = self.llmclient.files.upload(file=filepath)
                print(upload_file)
                # We use Gemini 1.5 Flash because it's fast and cheap
                vision_response = self.llmclient.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[
                        upload_file,
                        "Detailed description of this image for retrieval purposes."
                    ]
                )
                vision_description = vision_response.text

                response = self.llmclient.models.embed_content(
                    model='gemini-embedding-001',
                    contents=vision_description,
                    config=types.EmbedContentConfig(output_dimensionality=768)
                )
                text_content = "Image File"
        
        elif type(content) == str:
            # Content is text
            response = self.llmclient.models.embed_content(
                model='gemini-embedding-001',
                contents=content,
                config=types.EmbedContentConfig(output_dimensionality=768)
            )
            text_content = 'Text'
        else:
            print(f'[VDB-ERR] NO VALID TYPE FOUND FOR FILE: {filepath}\n{content}')
        return response.embeddings[0].values, text_content


    def save_vector(self, vector, filepath: str, filetype: str, description: str=None):
        # Store in LanceDB
        self.vdb.kb_table.add([{
            "vector": vector,
            "file_path": filepath,
            "file_type": mime if mime else filepath.split('.')[-1],
            "description": text_content[:100]
        }])
        print(f'[LANCE-EMBED] Embedded file in vector database: {filepath}')

        return vector
    
    
    def vdb_search(self, content):
        # Knowledge base search
        vector, _ = self.embed(content=content)
        res = self.kb_table.search(vector).select(['file_path']).limit(3).to_pandas()['file_path'].tolist()
        print(res)
        return res 
    
    
    def save_file(self, filename: str=None, content: bytearray=None):
        filepath = os.path.join(STORAGE_PATH, filename)

        if filepath:
            with open(filepath, 'wb') as f:
                f.write(content)
        return filepath