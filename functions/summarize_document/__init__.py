from councilofelders.llamaindex import LlamaIndexOpenAIAgent
from firebase_functions import logger, https_fn
from firebase_admin import firestore


from requests import get, RequestException
from ebooklib import epub
import ebooklib
from bs4 import BeautifulSoup
import fitz

import tiktoken
from openai import OpenAI

from councilofelders.cohort import Cohort
from councilofelders.openai import OpenAIAgent
from councilofelders.anthropic import AnthropicAgent
from councilofelders.replicate import ReplicateLlamaAgent, ReplicateGraniteAgent
from councilofelders.vertex import GemeniAgent


def summarize_document_local(request, db):
    logger.log("Summarizing document")
    try:
        document_id = request.data['documentId']
        bot_name = request.data['botName']
        library = request.data['library']
        uid = request.data['uid']

        # Retrieve document
        if library == 'public':
            document_ref = db.collection('public_library').document(document_id)
            doc = document_ref.get()
        else:
            user_ref = db.collection('users').document(uid)
            library_ref = user_ref.collection('library').document(document_id)
            doc = library_ref.get()

        if not doc.exists:
            raise https_fn.HttpsError('not-found', 'Document not found.')

        document_data = doc.to_dict()

        # Retrieve bot information
        user_data = user_ref.get().to_dict()
        bots = user_data.get('bots', [])
        bot = next((bot for bot in bots if bot['name'] == bot_name), None)

        user_doc = db.collection('users').document(uid).get().to_dict()
        user_keys = user_doc['apiKeys']
        api_key = next((key for key in user_keys if key['name'] == bot['key']), None)['apikey']
        if not bot:
            raise https_fn.HttpsError('not-found', 'Bot not found.')

        service = bot['service']
        model = bot['model']
        system_prompt = bot['systemPrompt']
        temperature = bot['temperature']
        if service == "OpenAI":
            logger.log("OpenAI service selected")
            agent = OpenAIAgent(model=model,
                                system_prompt=system_prompt,
                                temperature=temperature,
                                name=bot_name,
                                api_key=api_key)
            logger.log("Agent created")
        elif service == "Anthropic":
            logger.log("Anthropic service selected")
            agent = AnthropicAgent(model=model,
                                   system_prompt=system_prompt,
                                   temperature=temperature,
                                   name=bot_name,
                                   api_key=api_key)
        elif service == "Replicate":
            logger.log("Replicate service selected")
            if 'llama' in model:
                agent = ReplicateLlamaAgent(model=model,
                                            system_prompt=system_prompt,
                                            temperature=temperature,
                                            name=bot_name,
                                            api_key=api_key)

            elif 'granite' in model:
                agent = ReplicateGraniteAgent(model=model,
                                              system_prompt=system_prompt,
                                              temperature=temperature,
                                              name=bot_name,
                                              api_key=api_key)
        elif service == "Vertex":
            logger.log("Vertex service selected")
            agent = GemeniAgent(model=model,
                                system_prompt=system_prompt,
                                temperature=temperature,
                                name=bot_name,
                                api_key=api_key)
        elif service == "RAG: OpenAI+Pinecone":
            logger.log("RAG: OpenAI+Pinecone service selected")
            pinecone_api_key = next((key for key in user_keys if key['name'] == bot['pineconeKey']), None)['apikey']
            agent = LlamaIndexOpenAIAgent(model=model,
                                          system_prompt=system_prompt,
                                          temperature=temperature,
                                          name=bot_name,
                                          openai_api_key=api_key,
                                          pinecone_index_name=bot['pineconeIndex'],
                                          pinecone_api_key=pinecone_api_key,
                                          top_k=int(bot['top_k']))

        response = get(document_data["downloadUrl"])
        content = response.content
        logger.log("getting content")
        if document_data['filePath'].endswith('.epub'):
            logger.log("epub file")
            with open('./temp.epub', 'wb') as f:
                f.write(content)
            book = epub.read_epub('./temp.epub')
            text = []
            logger.log('epub downloaded')
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    soup = BeautifulSoup(item.get_body_content(), 'html.parser')
                    text.append(soup.get_text())

            decoded_content = '\n'.join(text)
            logger.log("text extracted from epub")
        elif document_data['filePath'].endswith('.pdf'):
            pdf_document = fitz.open("pdf", content)
            text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                text += page.get_text()
            decoded_content = text
        else:
            decoded_content = content.decode('utf-8')

        logger.log("text extracted")
        encoding = tiktoken.get_encoding("cl100k_base")
        if len(encoding.encode(decoded_content)) > 64000:
            logger.log("Document too large, shortening to 64k tokens")
            decoded_content = encoding.decode(encoding.encode(decoded_content)[:64000])

        summary_prompt = """Summarize this document, only return the summary, do not include any preamble. You may only have the first portion of the document, in that case do your best to extrapolate and provide a summary of the entire document."""
        hx = [{"name": "content", "response": decoded_content},
              {"name": "user", "response": summary_prompt}]

        logger.log("History built")
        # Perform summarization
        elders = Cohort(agents=[agent], history=hx)
        logger.log("council built")
        msg = elders.agents[0].generate_next_message()
        logger.log("Message generated")

        update_data = {'description': msg}

        library_ref.update(update_data)


    except RequestException as e:
        logger.error(f"RequestException: {str(e)}")
        raise https_fn.HttpsError('invalid-argument', 'Failed to fetch the document content. ' + str(e), details=str(e))
    except Exception as e:
        logger.error(f"Error summarizing document: {str(e)}")
        raise https_fn.HttpsError('internal', 'Failed to summarize the document. ' + str(e), details=str(e))

def add_tags_to_document_local(request, db):
    try:
        document_id = request.data['documentId']
        library = request.data['library']
        uid = request.data['uid']

        # Lazy hack- just grab the first openai key you find
        user_doc = db.collection('users').document(uid).get().to_dict()
        api_keys = user_doc['apiKeys']
        openai_api_key = next((key for key in api_keys if key['svc'] == 'OpenAI'), None)['apikey']


        # Retrieve the document
        if library == 'public':
            document_ref = db.collection('public_library').document(document_id)
        else:
            user_ref = db.collection('users').document(uid)
            document_ref = user_ref.collection('library').document(document_id)

        doc = document_ref.get()
        if not doc.exists:
            raise https_fn.HttpsError('not-found', 'Document not found.')

        document_data = doc.to_dict()

        # Fetch document content
        response = get(document_data["downloadUrl"])
        content = response.content

        # Decode and extract text
        if document_data['filePath'].endswith('.epub'):
            with open('./temp.epub', 'wb') as f:
                f.write(content)
            book = epub.read_epub('./temp.epub')
            text = []
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    soup = BeautifulSoup(item.get_body_content(), 'html.parser')
                    text.append(soup.get_text())
            decoded_content = '\n'.join(text)
        elif document_data['filePath'].endswith('.pdf'):
            pdf_document = fitz.open("pdf", content)
            text = ""
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                text += page.get_text()
            decoded_content = text
        else:
            decoded_content = content.decode('utf-8')

            # Token handling
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(decoded_content)
        shortened_content = encoding.decode(tokens[:12000])  # Use first 12,000 tokens


        # OpenAI API call to generate tags
        prompt = (f"{shortened_content}\n\n"
                  "The proceeding text is the first 12,000 tokens of a larger document. "
                  "Please analyze and generate a brief, comma-separated list of potential tags (approximately 20) "
                  "that capture the main topics or themes of this text, bearing in mind that there may be more content beyond this excerpt. "
                  "Your answer should only be a comma seperated list of tags, no preamble or other text.\n\n"
                  )

        client = OpenAI(api_key=openai_api_key)
        completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )


        tags_to_add = [tag.strip().lower() for tag in completion.choices[0].message.content.split(',') if tag.strip()]

        # Update Firestore document with new tags
        document_ref.update({'tags': firestore.ArrayUnion(tags_to_add)})

        return {"tags": tags_to_add}

    except Exception as e:
        logger.error(f"Error adding tags: {str(e)}")
        raise https_fn.HttpsError('internal', 'Failed to add tags to the document. ' + str(e), details=str(e))
