package httpapi

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"reflect"
	"strings"
	"unicode/utf8"
)

var errJSONShape = errors.New("invalid JSON object")

func validateJSONNames(data []byte, destination any) error {
	if !utf8.Valid(data) {
		return errJSONShape
	}

	typ := reflect.TypeOf(destination)
	if typ.Kind() != reflect.Pointer || typ.Elem().Kind() != reflect.Struct {
		return errJSONShape
	}

	decoder := json.NewDecoder(bytes.NewReader(data))
	decoder.UseNumber()
	if err := checkObject(decoder, typ.Elem()); err != nil {
		return err
	}

	if _, err := decoder.Token(); err != io.EOF {
		return errJSONShape
	}

	return nil
}

func checkObject(decoder *json.Decoder, typ reflect.Type) error {
	token, err := decoder.Token()
	if err != nil || token != json.Delim('{') {
		return errJSONShape
	}

	fields := make(map[string]reflect.Type)
	for i := 0; i < typ.NumField(); i++ {
		field := typ.Field(i)
		name := strings.Split(field.Tag.Get("json"), ",")[0]
		if field.IsExported() && name != "" && name != "-" {
			fields[name] = field.Type
		}
	}

	seen := make(map[string]bool)
	for decoder.More() {
		token, err := decoder.Token()
		if err != nil {
			return errJSONShape
		}

		name, ok := token.(string)
		fieldType, known := fields[name]
		if !ok || !known || seen[name] {
			return errJSONShape
		}

		seen[name] = true
		for fieldType.Kind() == reflect.Pointer {
			fieldType = fieldType.Elem()
		}

		// Nested DTOs must use named structs, not maps of arbitrary user-controlled keys.
		if fieldType.Kind() == reflect.Struct {
			if err := checkObject(decoder, fieldType); err != nil {
				return err
			}
		} else {
			var value json.RawMessage
			if err := decoder.Decode(&value); err != nil {
				return errJSONShape
			}
		}
	}

	token, err = decoder.Token()
	if err != nil || token != json.Delim('}') {
		return errJSONShape
	}

	return nil
}
