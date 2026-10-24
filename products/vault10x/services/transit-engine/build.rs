fn main() -> Result<(), Box<dyn std::error::Error>> {
    tonic_build::configure()
        .build_server(false)
        .build_client(true)
        .compile_protos(
            &[
                "../../proto/vault10x/policy/v1/service.proto",
                "../../proto/vault10x/audit/v1/service.proto",
            ],
            &["../../proto"],
        )?;
    Ok(())
}
