package com.rabit.api.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeBulkRequest {

    @NotEmpty(message = "At least one document type name is required")
    private List<String> names;
}
