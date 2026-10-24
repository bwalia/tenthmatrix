fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &[
                "../../proto/vault10x/secret/v1/service.proto",
                "../../proto/vault10x/crypto/v1/service.proto",
                "../../proto/vault10x/policy/v1/service.proto",
                "../../proto/vault10x/audit/v1/service.proto",
                "../../proto/vault10x/lease/v1/service.proto",
            ],
            &["../../proto"],
        )?;
    Ok(())
}
