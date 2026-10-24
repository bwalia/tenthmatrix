fn main() -> Result<(), Box<dyn std::error::Error>> {
    let protoc_path =
        protoc_bin_vendored::protoc_bin_path().expect("vendored protoc binary must be available");
    std::env::set_var("PROTOC", protoc_path);

    tonic_build::configure()
        .build_server(true)
        .build_client(true)
        .compile_protos(
            &[
                "../../proto/vault10x/identity/v1/service.proto",
                // Signing keys are wrapped by the crypto-service so they sit
                // under the root KEK, and therefore under the seal.
                "../../proto/vault10x/crypto/v1/service.proto",
                "../../proto/vault10x/lease/v1/service.proto",
            ],
            &["../../proto"],
        )?;
    Ok(())
}
