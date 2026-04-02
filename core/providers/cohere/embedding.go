package cohere

import (
	"fmt"

	"github.com/google/uuid"
	"github.com/maximhq/bifrost/core/providers/utils"
	"github.com/maximhq/bifrost/core/schemas"
)

func cohereContentBlockFromEmbeddingPart(part schemas.EmbeddingContentPart) (*CohereContentBlock, error) {
	if err := part.Validate(); err != nil {
		return nil, err
	}
	switch part.Type {
	case schemas.EmbeddingContentPartTypeText:
		text := *part.Text
		return &CohereContentBlock{Type: CohereContentBlockTypeText, Text: &text}, nil
	case schemas.EmbeddingContentPartTypeImage:
		if part.Image.URL != nil {
			return &CohereContentBlock{
				Type:     CohereContentBlockTypeImage,
				ImageURL: &CohereImageURL{URL: *part.Image.URL},
			}, nil
		}
		if part.Image.Data != nil {
			return &CohereContentBlock{
				Type:     CohereContentBlockTypeImage,
				ImageURL: &CohereImageURL{URL: *part.Image.Data},
			}, nil
		}
		return nil, fmt.Errorf("cohere image part missing data")
	default:
		return nil, fmt.Errorf("cohere embeddings support only text and image parts")
	}
}

func embeddingContentFromCohereBlocks(blocks []CohereContentBlock) (schemas.EmbeddingContent, error) {
	result := make(schemas.EmbeddingContent, 0, len(blocks))
	for _, block := range blocks {
		switch block.Type {
		case CohereContentBlockTypeText:
			if block.Text == nil {
				return nil, fmt.Errorf("cohere text block missing text")
			}
			text := *block.Text
			result = append(result, schemas.EmbeddingContentPart{
				Type: schemas.EmbeddingContentPartTypeText,
				Text: &text,
			})
		case CohereContentBlockTypeImage:
			if block.ImageURL == nil {
				return nil, fmt.Errorf("cohere image block missing image_url")
			}
			url := block.ImageURL.URL
			result = append(result, schemas.EmbeddingContentPart{
				Type:  schemas.EmbeddingContentPartTypeImage,
				Image: &schemas.EmbeddingMediaPart{URL: &url},
			})
		default:
			return nil, fmt.Errorf("unsupported cohere embedding block type %q", block.Type)
		}
	}
	return result, nil
}

func isSingleImageContent(content schemas.EmbeddingContent) (string, bool) {
	if len(content) != 1 || content[0].Type != schemas.EmbeddingContentPartTypeImage || content[0].Image == nil {
		return "", false
	}
	if content[0].Image.URL != nil {
		return *content[0].Image.URL, true
	}
	if content[0].Image.Data != nil {
		return *content[0].Image.Data, true
	}
	return "", false
}

// ToCohereEmbeddingRequest converts a Bifrost embedding request to Cohere format.
func ToCohereEmbeddingRequest(bifrostReq *schemas.BifrostEmbeddingRequest) *CohereEmbeddingRequest {
	if bifrostReq == nil || bifrostReq.Input == nil || len(bifrostReq.Input.Contents) == 0 {
		return nil
	}

	cohereReq := &CohereEmbeddingRequest{
		Model:     bifrostReq.Model,
		InputType: "search_document",
	}
	if bifrostReq.Params != nil {
		cohereReq.OutputDimension = bifrostReq.Params.Dimensions
		cohereReq.MaxTokens = bifrostReq.Params.MaxTokens
		cohereReq.Truncate = bifrostReq.Params.Truncate
		cohereReq.ExtraParams = bifrostReq.Params.ExtraParams
	}

	contents := bifrostReq.Input.Contents

	// All single-text contents → texts[]
	texts := make([]string, 0, len(contents))
	allSingleText := true
	for _, content := range contents {
		if len(content) == 1 && content[0].Type == schemas.EmbeddingContentPartTypeText && content[0].Text != nil {
			texts = append(texts, *content[0].Text)
		} else {
			allSingleText = false
			break
		}
	}
	if allSingleText {
		cohereReq.Texts = texts
	} else if len(contents) == 1 {
		// Single content with single image → images[]
		if imageURL, ok := isSingleImageContent(contents[0]); ok {
			cohereReq.Images = []string{imageURL}
		} else {
			// Single multimodal content → inputs[] with one entry
			blocks := make([]CohereContentBlock, 0, len(contents[0]))
			for _, part := range contents[0] {
				block, err := cohereContentBlockFromEmbeddingPart(part)
				if err != nil {
					return nil
				}
				blocks = append(blocks, *block)
			}
			cohereReq.Inputs = []CohereEmbeddingInput{{Content: blocks}}
		}
	} else {
		// Batch multimodal → inputs[], one entry per content
		inputs := make([]CohereEmbeddingInput, 0, len(contents))
		for _, content := range contents {
			blocks := make([]CohereContentBlock, 0, len(content))
			for _, part := range content {
				block, err := cohereContentBlockFromEmbeddingPart(part)
				if err != nil {
					return nil
				}
				blocks = append(blocks, *block)
			}
			inputs = append(inputs, CohereEmbeddingInput{Content: blocks})
		}
		cohereReq.Inputs = inputs
	}

	if bifrostReq.Params != nil && bifrostReq.Params.ExtraParams != nil {
		if embeddingTypes, ok := schemas.SafeExtractStringSlice(bifrostReq.Params.ExtraParams["embedding_types"]); ok {
			cohereReq.EmbeddingTypes = embeddingTypes
			if cohereReq.ExtraParams != nil {
				delete(cohereReq.ExtraParams, "embedding_types")
			}
		}
		if inputType, ok := schemas.SafeExtractString(bifrostReq.Params.ExtraParams["input_type"]); ok {
			cohereReq.InputType = inputType
			if cohereReq.ExtraParams != nil {
				delete(cohereReq.ExtraParams, "input_type")
			}
		}
		if priority, ok := schemas.SafeExtractIntPointer(bifrostReq.Params.ExtraParams["priority"]); ok {
			cohereReq.Priority = priority
			if cohereReq.ExtraParams != nil {
				delete(cohereReq.ExtraParams, "priority")
			}
		}
	}

	return cohereReq
}

// ToBifrostEmbeddingRequest converts a Cohere embedding request to Bifrost format.
// Each Cohere input entry maps to one element in Contents (one output embedding).
func (req *CohereEmbeddingRequest) ToBifrostEmbeddingRequest(ctx *schemas.BifrostContext) *schemas.BifrostEmbeddingRequest {
	if req == nil {
		return nil
	}

	provider, model := schemas.ParseModelString(req.Model, utils.CheckAndSetDefaultProvider(ctx, schemas.Cohere))
	bifrostReq := &schemas.BifrostEmbeddingRequest{
		Provider: provider,
		Model:    model,
		Input:    &schemas.EmbeddingInput{},
		Params:   &schemas.EmbeddingParameters{},
	}

	switch {
	case len(req.Texts) > 0:
		contents := make([]schemas.EmbeddingContent, len(req.Texts))
		for i, text := range req.Texts {
			t := text
			contents[i] = schemas.EmbeddingContent{{
				Type: schemas.EmbeddingContentPartTypeText,
				Text: &t,
			}}
		}
		bifrostReq.Input.Contents = contents
	case len(req.Images) > 0:
		url := req.Images[0]
		bifrostReq.Input.Contents = []schemas.EmbeddingContent{{{
			Type:  schemas.EmbeddingContentPartTypeImage,
			Image: &schemas.EmbeddingMediaPart{URL: &url},
		}}}
	case len(req.Inputs) > 0:
		contents := make([]schemas.EmbeddingContent, 0, len(req.Inputs))
		for _, input := range req.Inputs {
			content, err := embeddingContentFromCohereBlocks(input.Content)
			if err != nil {
				return nil
			}
			contents = append(contents, content)
		}
		bifrostReq.Input.Contents = contents
	}

	bifrostReq.Params.Dimensions = req.OutputDimension
	bifrostReq.Params.MaxTokens = req.MaxTokens
	bifrostReq.Params.Truncate = req.Truncate
	extraParams := req.ExtraParams
	if req.InputType != "" {
		if extraParams == nil {
			extraParams = map[string]interface{}{}
		}
		extraParams["input_type"] = req.InputType
	}
	if len(req.EmbeddingTypes) > 0 {
		if extraParams == nil {
			extraParams = map[string]interface{}{}
		}
		extraParams["embedding_types"] = req.EmbeddingTypes
	}
	if req.Priority != nil {
		if extraParams == nil {
			extraParams = map[string]interface{}{}
		}
		extraParams["priority"] = req.Priority
	}
	if len(extraParams) > 0 {
		bifrostReq.Params.ExtraParams = extraParams
	}

	return bifrostReq
}

// ToBifrostEmbeddingResponse converts a Cohere embedding response to Bifrost format
func (response *CohereEmbeddingResponse) ToBifrostEmbeddingResponse() *schemas.BifrostEmbeddingResponse {
	if response == nil {
		return nil
	}

	bifrostResponse := &schemas.BifrostEmbeddingResponse{
		Object: "list",
	}

	if response.Embeddings != nil {
		var bifrostEmbeddings []schemas.EmbeddingData
		if response.Embeddings.Float != nil {
			for i, embedding := range response.Embeddings.Float {
				bifrostEmbeddings = append(bifrostEmbeddings, schemas.EmbeddingData{
					Object: "embedding",
					Index:  i,
					Embedding: schemas.EmbeddingStruct{
						EmbeddingArray: embedding,
					},
				})
			}
		} else if response.Embeddings.Base64 != nil {
			for i, embedding := range response.Embeddings.Base64 {
				bifrostEmbeddings = append(bifrostEmbeddings, schemas.EmbeddingData{
					Object: "embedding",
					Index:  i,
					Embedding: schemas.EmbeddingStruct{
						EmbeddingStr: &embedding,
					},
				})
			}
		}
		bifrostResponse.Data = bifrostEmbeddings
	}

	if response.Meta != nil {
		if response.Meta.Tokens != nil {
			bifrostResponse.Usage = &schemas.BifrostLLMUsage{}
			if response.Meta.Tokens.InputTokens != nil {
				bifrostResponse.Usage.PromptTokens = int(*response.Meta.Tokens.InputTokens)
			}
			if response.Meta.Tokens.OutputTokens != nil {
				bifrostResponse.Usage.CompletionTokens = int(*response.Meta.Tokens.OutputTokens)
			}
			bifrostResponse.Usage.TotalTokens = bifrostResponse.Usage.PromptTokens + bifrostResponse.Usage.CompletionTokens
		} else if response.Meta.BilledUnits != nil {
			bifrostResponse.Usage = &schemas.BifrostLLMUsage{}
			if response.Meta.BilledUnits.InputTokens != nil {
				bifrostResponse.Usage.PromptTokens = int(*response.Meta.BilledUnits.InputTokens)
			}
			if response.Meta.BilledUnits.OutputTokens != nil {
				bifrostResponse.Usage.CompletionTokens = int(*response.Meta.BilledUnits.OutputTokens)
			}
			bifrostResponse.Usage.TotalTokens = bifrostResponse.Usage.PromptTokens + bifrostResponse.Usage.CompletionTokens
		}
	}

	return bifrostResponse
}

// ToCohereEmbeddingResponse converts a BifrostEmbeddingResponse to Cohere's native embedding response format.
func ToCohereEmbeddingResponse(bifrostResp *schemas.BifrostEmbeddingResponse) *CohereEmbeddingResponse {
	if bifrostResp == nil || len(bifrostResp.Data) == 0 {
		return nil
	}

	cohereResp := &CohereEmbeddingResponse{
		ID: uuid.New().String(),
	}

	embeddingData := &CohereEmbeddingData{}
	hasFloat := false
	hasBase64 := false

	for _, item := range bifrostResp.Data {
		switch {
		case item.Embedding.EmbeddingArray != nil:
			embeddingData.Float = append(embeddingData.Float, item.Embedding.EmbeddingArray)
			hasFloat = true
		case item.Embedding.EmbeddingStr != nil:
			embeddingData.Base64 = append(embeddingData.Base64, *item.Embedding.EmbeddingStr)
			hasBase64 = true
		case item.Embedding.Embedding2DArray != nil:
			for _, row := range item.Embedding.Embedding2DArray {
				embeddingData.Float = append(embeddingData.Float, row)
				hasFloat = true
			}
		}
	}

	if hasFloat || hasBase64 {
		cohereResp.Embeddings = embeddingData
	}

	responseType := "embeddings_by_type"
	if hasFloat && !hasBase64 {
		responseType = "embeddings_floats"
	}
	cohereResp.ResponseType = &responseType

	if bifrostResp.Usage != nil {
		inputTokens := bifrostResp.Usage.PromptTokens
		outputTokens := bifrostResp.Usage.CompletionTokens
		cohereResp.Meta = &CohereEmbeddingMeta{
			BilledUnits: &CohereBilledUnits{
				InputTokens:  &inputTokens,
				OutputTokens: &outputTokens,
			},
			Tokens: &CohereTokenUsage{
				InputTokens:  &inputTokens,
				OutputTokens: &outputTokens,
			},
		}
	}

	return cohereResp
}
